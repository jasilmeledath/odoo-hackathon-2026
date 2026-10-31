// Staff writes serialize password versions and never expose hashes (PS-5).
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { paginate } from '../../lib/pagination.js';
import { HttpError } from '../../lib/errors.js';
import { nextPasswordChangedAt } from '../../lib/sessions.js';
const BCRYPT_COST = 10;
const publicFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};
export function listStaff(query) {
  return paginate(
    prisma.user,
    {
      where: {
        role: 'INTERNAL',
        ...(query.q
          ? {
              OR: ['name', 'email'].map((field) => ({ [field]: { contains: query.q, mode: 'insensitive' } })),
            }
          : {}),
      },
      select: publicFields,
      orderBy: { id: 'desc' },
    },
    query,
  );
}
export async function saveStaff(id, { name, email, password, isActive }) {
  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_COST) : null;
  const conflict = () =>
    new HttpError(409, 'An account with this email already exists', {
      email: 'An account with this email already exists',
    });
  try {
    return await prisma.$transaction(async (transaction) => {
      let staff;
      if (id) {
        // Serialize password changes so even writes in one millisecond get different versions.
        await transaction.$queryRaw`SELECT id FROM users WHERE id = ${id} FOR UPDATE`;
        staff = await transaction.user.findFirst({
          where: { id, role: 'INTERNAL' },
          select: { id: true, passwordChangedAt: true },
        });
        if (!staff) throw new HttpError(404, 'Staff member not found');
      }
      if (
        await transaction.user.findFirst({
          where: { email, ...(id ? { id: { not: id } } : {}) },
          select: { id: true },
        })
      )
        throw conflict();
      const data = {
        name,
        email,
        isActive,
        ...(passwordHash
          ? {
              passwordHash,
              ...(id ? { passwordChangedAt: nextPasswordChangedAt(staff.passwordChangedAt) } : {}),
            }
          : {}),
      };
      return id
        ? transaction.user.update({ where: { id, role: 'INTERNAL' }, data, select: publicFields })
        : transaction.user.create({ data: { ...data, role: 'INTERNAL' }, select: publicFields });
    });
  } catch (error) {
    if (error.code === 'P2002') throw conflict();
    throw error;
  }
}
