// Atomic customer account creation (PS-1, PS-5, A-4). Never links an existing customer record.
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { signToken } from '../../middleware/auth.js';
const duplicateEmail = () =>
  new HttpError(409, 'An account with this email already exists', {
    email: 'An account with this email already exists',
  });
export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.$transaction(async (transaction) => {
      if (await transaction.user.findUnique({ where: { email } })) throw duplicateEmail();
      const account = await transaction.user.create({
        data: { name, email, passwordHash, role: 'CUSTOMER' },
      });
      // A staff-made customer with this email is not proof that the signer owns it, so the
      // account is created without linking. Staff link it after they verify the customer.
      const customer = await transaction.customer.findUnique({ where: { email } });
      if (customer) return { ...account, customerId: null };
      const created = await transaction.customer.create({ data: { name, email, userId: account.id } });
      return { ...account, customerId: created.id };
    });
    return {
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, customerId: user.customerId },
    };
  } catch (error) {
    if (error.code === 'P2002') throw duplicateEmail();
    throw error;
  }
}
