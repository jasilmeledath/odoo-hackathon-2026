// Display helpers. The API sends money as whole paise and dates as ISO strings;
// these turn them into what people read, and rupee input back into paise.
const PAISE_PER_RUPEE = 100;

const moneyFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

export const formatMoney = (paise) => moneyFormat.format((paise ?? 0) / PAISE_PER_RUPEE);

// Calendar dates are stored at 00:00 UTC, so they are formatted in UTC too.
export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '');

export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '');

export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export const toPaise = (rupees) => Math.round(Number(rupees) * PAISE_PER_RUPEE);

export const toRupees = (paise) => (paise ?? 0) / PAISE_PER_RUPEE;

// ACTIVE becomes "Active" and BANK_TRANSFER becomes "Bank transfer".
export const formatLabel = (value) => {
  const words = value.replaceAll('_', ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
