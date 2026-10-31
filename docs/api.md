# API Reference

| Field | Value |
|---|---|
| Version | 1.0 |
| Owner | Whoever adds or changes a route |
| Last updated | 31 October 2026 |
| Related documents | [Requirements](requirements.md) · [Data Model](data-model.md) · [Engineering Standards §6](engineering-standards.md#6-backend-and-api) · [Documentation Rules §5](documentation-rules.md#5-api-documentation-format) |

Base URL: `http://localhost:4000/api`. Every route except sign-up, login, password reset and health needs `Authorization: Bearer <token>`.

## Conventions

**Error format** (every non-2xx response). `fields` appears only for validation errors:

```json
{ "error": "Validation failed", "fields": { "email": "Enter a valid email address" } }
```

**Lists** take `page` (from 1) and `pageSize` (default 10, at most 50), and return:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 10, "pages": 1 }
```

**Money** is whole paise in both directions: `156000` means ₹1,560.00. **Dates** are `YYYY-MM-DD`.

**Status codes:** `200` OK · `201` created · `204` deleted · `400` validation failed · `401` not logged in · `403` not allowed · `404` not found, or another customer's record · `409` a conflict, such as a duplicate value or an action not allowed in the current status · `500` unexpected.

## Route map

This is the agreed contract. The **Done** column is ticked in the same commit that adds the route, along with a detailed entry below in the format from [Documentation Rules §5](documentation-rules.md#5-api-documentation-format).

**Roles:** Public · Any (any logged-in user) · Staff (Admin and Internal) · Admin · Customer.

### Health

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/health` | Public | Checks the API and the database connection | | Yes |

### Auth (`modules/auth`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| POST | `/auth/register` | Public | Customer sign-up. Creates the login and customer record, or links an existing customer with that email. Ignores any `role` sent | PS-1, PS-5 | |
| POST | `/auth/login` | Public | Returns `{ token, user }` | PS-2 | |
| GET | `/auth/me` | Any | The current user | PS-2 | |
| POST | `/auth/forgot-password` | Public | Emails a reset link. Always answers `200` | PS-3 | |
| POST | `/auth/reset-password` | Public | `{ token, password }`. The token works once, for 30 minutes | PS-3 | |

### Staff and customers (`modules/staff`, `modules/customers`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/staff` | Admin | List staff | PS-5 | |
| POST | `/staff` | Admin | Add a staff member | PS-5 | |
| PATCH | `/staff/:id` | Admin | Change details or `isActive` | PS-5 | |
| GET | `/customers` | Staff | List, with `q` searching name, company and email | PS-12 | |
| POST | `/customers` | Staff | Create a customer | PS-12 | |
| GET | `/customers/:id` | Staff | Customer with subscription and invoice summary | PS-12 | |
| PUT | `/customers/:id` | Staff | Update | PS-12 | |

### Catalog (`modules/taxes`, `modules/terms`, `modules/products`, `modules/plans`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/taxes` | Staff | List | PS-10 | |
| POST | `/taxes` | Admin | Create | PS-10 | |
| PUT | `/taxes/:id` | Admin | Update or deactivate | PS-10 | |
| GET | `/payment-terms` | Staff | List | PS-12 | |
| POST | `/payment-terms` | Admin | Create | PS-12 | |
| PUT | `/payment-terms/:id` | Admin | Update or deactivate | PS-12 | |
| GET | `/products` | Staff | List, filtered by `type`, `isActive`, `q` | PS-6 | |
| GET | `/products/:id` | Staff | Product with variants and plans | PS-6, PS-7 | |
| POST | `/products` | Admin | Create | PS-6 | |
| PUT | `/products/:id` | Admin | Update or deactivate | PS-6 | |
| POST | `/products/:id/variants` | Admin | Add a variant | PS-7 | |
| PUT | `/products/:id/variants/:variantId` | Admin | Update a variant | PS-7 | |
| DELETE | `/products/:id/variants/:variantId` | Admin | Remove a variant | PS-7 | |
| GET | `/plans` | Staff | List, filtered by `availableOn` (date), `isActive`, `q` | PS-8 | |
| GET | `/plans/:id` | Staff | One plan | PS-8 | |
| POST | `/plans` | Admin | Create | PS-8, PS-9 | |
| PUT | `/plans/:id` | Admin | Update or deactivate | PS-8, PS-9 | |

### Quotation templates and discounts (`modules/templates`, `modules/discounts`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/templates` | Staff | List | PS-11 | |
| GET | `/templates/:id` | Staff | Template with lines and current prices | PS-11 | |
| POST | `/templates` | Admin | Create with lines | PS-11 | |
| PUT | `/templates/:id` | Admin | Update with lines | PS-11 | |
| GET | `/discounts` | Staff | List, filtered by `state` (`ACTIVE`, `EXPIRED`, `USED_UP`) | PS-19 | |
| GET | `/discounts/:id` | Staff | Discount with products and usage | PS-19 | |
| POST | `/discounts` | Admin | Create | PS-19 | |
| PUT | `/discounts/:id` | Admin | Update or deactivate | PS-19 | |

### Subscriptions (`modules/subscriptions`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/subscriptions` | Staff | List, filtered by `status`, `customerId`, `planId`, `q` | PS-12, PS-13 | ✓ |
| GET | `/subscriptions/:id` | Staff | Subscription with lines, totals and invoices | PS-12 | |
| GET | `/subscriptions/:id/activity` | Staff | Timeline | PS-13 | |
| POST | `/subscriptions` | Staff | Create a draft. `templateId` fills in the plan and lines | PS-11, PS-12 | |
| PUT | `/subscriptions/:id` | Staff | Update, in Draft or Quotation only | PS-12 | |
| POST | `/subscriptions/:id/quote` | Staff | Draft → Quotation | PS-13 | |
| POST | `/subscriptions/:id/confirm` | Staff | Quotation → Confirmed | PS-13 | |
| POST | `/subscriptions/:id/activate` | Staff | Confirmed → Active | PS-13 | |
| POST | `/subscriptions/:id/pause` | Staff | Active → Paused, if the plan allows | PS-14 | |
| POST | `/subscriptions/:id/resume` | Staff | Paused → Active | PS-14 | |
| POST | `/subscriptions/:id/renew` | Staff | `{ expiryDate }`, if the plan allows | PS-14 | |
| POST | `/subscriptions/:id/close` | Staff | Close early, if the plan allows | PS-14 | |

### Billing and invoices (`modules/billing`, `modules/invoices`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/billing/due` | Staff | Subscriptions due, with a count and expected total | PS-15 | |
| POST | `/billing/run` | Staff | Bill everything due. Returns `{ created, skipped, failed }` | PS-15, PS-16, PS-20 | |
| POST | `/billing/subscriptions/:id` | Staff | Bill one subscription | PS-15 | |
| GET | `/invoices` | Staff | List, filtered by `status`, `isOverdue`, `customerId`, `from`, `to`, `q` | PS-17, PS-22 | ✓ |
| GET | `/invoices/:id` | Staff | Invoice with lines and payments | PS-17 | |
| POST | `/invoices/:id/confirm` | Staff | Draft → Confirmed | PS-17 | |
| POST | `/invoices/confirm-all` | Staff | `{ invoiceIds }`: confirm in bulk | PS-17 | |
| POST | `/invoices/:id/cancel` | Staff | Cancel if it has no payments. The period returns to the billing queue | PS-17 | |
| POST | `/invoices/:id/send` | Staff | Emails the invoice and sets `sentAt`. Printing is done in the browser | PS-18 | |

### Payments (`modules/payments`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/payments` | Staff | List, filtered by `method`, `from`, `to`, `q` | PS-21 | |
| POST | `/payments` | Staff | `{ invoiceId, method, amount, paymentDate, note }` | PS-21, PS-22 | |

### Reports (`modules/reports`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/reports/summary` | Staff | Active subscriptions, monthly recurring revenue, revenue, outstanding and overdue, for `from` and `to` | PS-23, PS-24 | ✓ |
| GET | `/reports/revenue` | Staff | Revenue by month, for the chart | PS-24 | |
| GET | `/reports/renewals` | Staff | Active subscriptions expiring in 30 days or overdue for renewal | PS-23 | ✓ |
| GET | `/reports/events` | Staff | Server-Sent Events stream that says when numbers change | PS-28 | |

### Customer portal (`modules/portal`)

Every portal query is limited to the logged-in customer. Anyone else's record returns `404`.

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/portal/subscriptions` | Customer | Own subscriptions | PS-26 | |
| GET | `/portal/subscriptions/:id` | Customer | One subscription with lines | PS-26 | |
| POST | `/portal/subscriptions/:id/accept` | Customer | Accept a quotation | PS-27 | |
| PATCH | `/portal/subscriptions/:id/lines/:lineId` | Customer | `{ isActive }`: switch an add-on on or off | PS-27 | |
| POST | `/portal/subscriptions/:id/pause` | Customer | Pause, if the plan allows | PS-27 | |
| POST | `/portal/subscriptions/:id/resume` | Customer | Resume | PS-27 | |
| POST | `/portal/subscriptions/:id/close` | Customer | Close, if the plan allows | PS-27 | |
| GET | `/portal/invoices` | Customer | Own invoices | PS-26 | |
| GET | `/portal/invoices/:id` | Customer | One invoice with lines and payments | PS-26 | |

---

## Route details

### GET /api/health

Checks the API and the database connection. **Auth:** none.

**Responses:** `200` `{ "ok": true }` · `500` the database cannot be reached

### GET /api/subscriptions

List subscriptions, newest start date first. **Auth:** Admin, Internal. Refs: PS-12, PS-13.

**Query**

| Field | Type | Rules |
|---|---|---|
| `page`, `pageSize` | number | Page from 1. Page size 1 to 50, default 10 |
| `status` | string | `DRAFT`, `QUOTATION`, `CONFIRMED`, `ACTIVE`, `PAUSED` or `CLOSED` |
| `customerId`, `planId` | number | Positive record IDs |
| `q` | string | At most 100 characters; matches subscription number, customer name/company or plan name, ignoring case |

Filters combine with AND. **Response** `200`: `{ items, total, page, pageSize, pages }`. Each item includes subscription `id`, `number`, `status`, `startDate`, `expiryDate`, `recurringAmount`, `customer` (`id`, `name`, `companyName`) and `plan` (`id`, `name`, `billingPeriod`). Money is in paise.

**Responses:** `200` the page of subscriptions · `400` invalid query (`fields.status`, `fields.customerId`, `fields.planId`) · `401` not logged in · `403` not staff

### GET /api/reports/summary

Read finance totals and the ten oldest overdue invoices. Revenue is the sum of payments received in the requested period; invoiced and outstanding balances are reported separately. Overdue is calculated from confirmed invoices past their due date. **Auth:** Admin, Internal. Refs: PS-23, PS-24.

**Query** `from`, `to`: optional `YYYY-MM-DD` issue/payment date bounds. When omitted, the period defaults to the first day of the current IST month through today. `to` cannot be before `from`.

**Response** `200`: `{ period, activeSubscriptionCount, monthlyRecurringAmount, invoicedAmount, revenueAmount, outstandingAmount, overdueAmount, overdueInvoices }`. `overdueInvoices` contains at most ten oldest overdue entries with `balanceAmount`. Money is in paise.

**Responses:** `200` the summary · `400` invalid date (`fields.from`, `fields.to`) · `401` not logged in · `403` not staff

### GET /api/reports/renewals

List active subscriptions expiring within 30 days and active subscriptions already past expiry whose plan does not close automatically (A-20). Results are ordered by expiry date, oldest first. **Auth:** Admin, Internal. Refs: PS-23.

**Query** `page`, `pageSize`: standard pagination; `q`: at most 100 characters, matching the subscription number, customer name/company, or plan name.

**Response** `200`: `{ items, total, page, pageSize, pages }`. Each item includes the subscription number, expiry date, recurring amount, customer, and plan renewal flags.

**Responses:** `200` the page of renewals · `400` invalid pagination/search query · `401` not logged in · `403` not staff

### GET /api/invoices

List invoices, newest first, with the balance and whether each is overdue. **Auth:** Admin, Internal. Refs: PS-17, PS-22.

**Query**

| Field | Type | Rules |
|---|---|---|
| `page`, `pageSize` | number | Page from 1. Page size 1 to 50, default 10 |
| `status` | string | `DRAFT`, `CONFIRMED`, `PAID` or `CANCELED`. `CONFIRMED` means outstanding |
| `isOverdue` | string | `true`: confirmed with a due date before today. `false`: everything else. Worked out when asked, never stored (A-15) |
| `customerId` | number | An existing customer |
| `from`, `to` | string | `YYYY-MM-DD`, filter on the issue date. `to` must not be before `from` |
| `q` | string | At most 100 chars. Matches the invoice number or customer name, ignoring case |

Filters combine with AND, so `status=PAID&isOverdue=true` returns nothing.

**Response** `200`: `{ items, total, page, pageSize, pages }`. Each item has `id`, `number`, `status`, `billingName`, `issueDate`, `dueDate`, `totalAmount`, `paidAmount`, `balanceAmount`, `isOverdue`, `sentAt` and `subscription` (`id`, `number`). Money is in paise.

**Responses:** `200` the page of invoices · `400` validation (`fields.to`, `fields.status`) · `401` not logged in · `403` not staff

<!-- Add one entry per route, grouped by module, in the format from
docs/documentation-rules.md §5. Add it in the same commit as the route. -->
