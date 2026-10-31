// Authenticate active accounts without revealing whether an email exists (PS-2).
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { signToken } from '../../middleware/auth.js';

const DUMMY_HASH = bcrypt.hashSync('Unused authentication timing value', 10);

export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  customerId: user.customer?.id ?? user.customerId ?? null,
});

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { customer: { select: { id: true } } },
  });
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!matches || !user?.isActive) throw new HttpError(401, 'Email or password is incorrect');
  return { token: signToken(user), user: publicUser(user) };
}
