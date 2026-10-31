// PS-17: bounded bulk confirmation reuses the single-invoice transaction and audit rules.
import { confirmInvoice } from './invoices.service.js';

export const confirmInvoices = async (invoiceIds, actor) => {
  const result = { confirmed: 0, skipped: 0, failed: 0 };
  for (const id of [...new Set(invoiceIds)].sort((first, second) => first - second)) {
    try {
      await confirmInvoice(id, actor);
      result.confirmed += 1;
    } catch (error) {
      if ([404, 409].includes(error.status)) result.skipped += 1;
      else {
        console.error(`Bulk confirmation failed for invoice ${id}`, error);
        result.failed += 1;
      }
    }
  }
  return result;
};
