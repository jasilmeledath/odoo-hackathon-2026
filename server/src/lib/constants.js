// Shared limits. Enumerated values are not repeated here: Zod schemas read them
// from the Prisma enums, for example z.enum(InvoiceStatus) from '../generated/prisma/enums.js'.

export const STAFF_ROLES = ['ADMIN', 'INTERNAL'];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
