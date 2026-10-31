// Shared list behaviour: every list route validates listQuerySchema (extended
// with its own filters) and returns paginate()'s { items, total, page, pageSize, pages }.
import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants.js';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  q: z.string().trim().max(100).optional(),
});

export const paginate = async (model, args, { page, pageSize }) => {
  const [items, total] = await Promise.all([
    model.findMany({ ...args, skip: (page - 1) * pageSize, take: pageSize }),
    model.count({ where: args.where }),
  ]);
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
};
