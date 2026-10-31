// Subscription list queries (PS-12, PS-13). Business rules stay in this module.
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const buildListConditions = ({ status, customerId, planId, q }) => {
  const conditions = [];
  if (status) conditions.push({ status });
  if (customerId) conditions.push({ customerId });
  if (planId) conditions.push({ planId });
  if (q) {
    conditions.push({
      OR: [
        { number: { contains: q, mode: 'insensitive' } },
        {
          customer: {
            is: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { companyName: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
        { plan: { is: { name: { contains: q, mode: 'insensitive' } } } },
      ],
    });
  }
  return conditions;
};

const LIST_SELECT = {
  id: true,
  number: true,
  status: true,
  startDate: true,
  expiryDate: true,
  recurringAmount: true,
  customer: { select: { id: true, name: true, companyName: true } },
  plan: { select: { id: true, name: true, billingPeriod: true } },
};

export const listSubscriptions = async (query) =>
  paginate(
    prisma.subscription,
    {
      where: { AND: buildListConditions(query) },
      select: LIST_SELECT,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    },
    query,
  );
