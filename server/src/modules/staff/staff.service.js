// Internal-account administration; hashes never leave this service (PS-5).
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { paginate } from '../../lib/pagination.js';
import { HttpError } from '../../lib/errors.js';
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
  if (id && !(await prisma.user.findFirst({ where: { id, role: 'INTERNAL' }, select: { id: true } })))
    throw new HttpError(404, 'Staff member not found');
  const conflict = () =>
    new HttpError(409, 'An account with this email already exists', {
      email: 'An account with this email already exists',
    });
  if (
    await prisma.user.findFirst({
      where: { email, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    })
  )
    throw conflict();
  const data = {
    name,
    email,
    isActive,
    ...(password ? { passwordHash: await bcrypt.hash(password, 10), passwordChangedAt: new Date() } : {}),
  };
  try {
    return id
      ? await prisma.user.update({ where: { id, role: 'INTERNAL' }, data, select: publicFields })
      : await prisma.user.create({ data: { ...data, role: 'INTERNAL' }, select: publicFields });
  } catch (error) {
    if (error.code === 'P2002') throw conflict();
    throw error;
  }
}
