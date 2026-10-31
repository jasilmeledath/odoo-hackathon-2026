// Single-use hashed recovery tokens and session invalidation (PS-3, A-2).
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { reportError } from '../../middleware/error.js';
import { sendMail } from '../../lib/mail.js';
import { nextPasswordChangedAt } from '../../lib/sessions.js';
const RESET_LIFETIME_MS = 30 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export const RECOVERY_MESSAGE = 'If an active account exists, a reset link has been sent';
export async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
  if (user?.isActive) {
    const token = randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_LIFETIME_MS),
      },
    });
    const link = new URL('/reset-password', process.env.CLIENT_ORIGIN);
    link.searchParams.set('token', token);
    try {
      await sendMail({
        to: email,
        subject: 'Reset your Brightloop password',
        text: 'This link works once, for 30 minutes: ' + link.href,
      });
    } catch (error) {
      reportError(new Error('Password reset delivery failed', { cause: error }));
    }
  }
  return { message: RECOVERY_MESSAGE };
}
export async function resetPassword({ token, password }) {
  const invalid = () =>
    new HttpError(400, 'Reset link is invalid or expired', { token: 'Reset link is invalid or expired' });
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record) throw invalid();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (transaction) => {
    // Serialize all outstanding links for this account, not just this token.
    await transaction.$queryRaw`SELECT id FROM users WHERE id = ${record.userId} FOR UPDATE`;
    const user = await transaction.user.findUnique({
      where: { id: record.userId },
      select: { isActive: true, passwordChangedAt: true },
    });
    const now = new Date();
    if (!user?.isActive) throw invalid();
    const claimed = await transaction.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (!claimed.count) throw invalid();
    await transaction.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: nextPasswordChangedAt(user.passwordChangedAt) },
    });
    await transaction.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    });
  });
  return { message: 'Password reset. Please log in with your new password' };
}
