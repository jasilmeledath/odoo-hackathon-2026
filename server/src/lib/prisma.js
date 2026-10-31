// The single Prisma client shared by every route.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
