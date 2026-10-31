// Human-readable record numbers: SUB-000001 and INV-000001 (PS-12, PS-15).

const PREFIXES = { SUBSCRIPTION: 'SUB', INVOICE: 'INV' };
const NUMBER_LENGTH = 6;

// Call with the transaction client. The counter row stays locked until commit,
// so a rollback gives the number back and the sequence has no gaps.
export const nextNumber = async (tx, key) => {
  const { value } = await tx.documentCounter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${PREFIXES[key]}-${String(value).padStart(NUMBER_LENGTH, '0')}`;
};
