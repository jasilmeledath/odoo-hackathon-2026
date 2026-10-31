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
| POST | `/auth/register` | Public | Customer sign-up. Creates the login and customer record, or links an existing customer with that email. Ignores any `role` sent | PS-1, PS-5 | Yes |
| POST | `/auth/login` | Public | Returns `{ token, user }` | PS-2 | Yes |
| GET | `/auth/me` | Any | The current user | PS-2 | Yes |
| POST | `/auth/forgot-password` | Public | Emails a reset link. Always answers `200` | PS-3 | Yes |
| POST | `/auth/reset-password` | Public | `{ token, password }`. The token works once, for 30 minutes | PS-3 | Yes |

### Staff and customers (`modules/staff`, `modules/customers`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/staff` | Admin | List staff | PS-5 | Yes |
| POST | `/staff` | Admin | Add a staff member | PS-5 | Yes |
| PATCH | `/staff/:id` | Admin | Change details or `isActive` | PS-5 | Yes |
| GET | `/customers` | Staff | List, with `q` searching name, company and email | PS-12 | Yes |
| POST | `/customers` | Staff | Create a customer | PS-12 | Yes |
| GET | `/customers/:id` | Staff | Customer with subscription and invoice summary | PS-12 | Yes |
| PUT | `/customers/:id` | Staff | Update | PS-12 | Yes |

### Catalog (`modules/taxes`, `modules/terms`, `modules/products`, `modules/plans`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/taxes` | Staff | List | PS-10 | Yes |
| POST | `/taxes` | Admin | Create | PS-10 | Yes |
| PUT | `/taxes/:id` | Admin | Update or deactivate | PS-10 | Yes |
| GET | `/payment-terms` | Staff | List | PS-12 | Yes |
| POST | `/payment-terms` | Admin | Create | PS-12 | Yes |
| PUT | `/payment-terms/:id` | Admin | Update or deactivate | PS-12 | Yes |
| GET | `/products` | Staff | List, filtered by `type`, `isActive`, `q` | PS-6 | Yes |
| GET | `/products/:id` | Staff | Product with variants and plans | PS-6, PS-7 | Yes |
| POST | `/products` | Admin | Create | PS-6 | Yes |
| PUT | `/products/:id` | Admin | Update or deactivate | PS-6 | Yes |
| POST | `/products/:id/variants` | Admin | Add a variant | PS-7 | Yes |
| PUT | `/products/:id/variants/:variantId` | Admin | Update a variant | PS-7 | Yes |
| DELETE | `/products/:id/variants/:variantId` | Admin | Remove a variant | PS-7 | Yes |
| GET | `/plans` | Staff | List, filtered by `availableOn` (date), `isActive`, `q` | PS-8 | Yes |
| GET | `/plans/:id` | Staff | One plan | PS-8 | Yes |
| POST | `/plans` | Admin | Create | PS-8, PS-9 | Yes |
| PUT | `/plans/:id` | Admin | Update or deactivate | PS-8, PS-9 | Yes |

### Quotation templates and discounts (`modules/templates`, `modules/discounts`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/templates` | Staff | List | PS-11 | Yes |
| GET | `/templates/:id` | Staff | Template with lines and current prices | PS-11 | Yes |
| POST | `/templates` | Admin | Create with lines | PS-11 | Yes |
| PUT | `/templates/:id` | Admin | Update with lines | PS-11 | Yes |
| GET | `/discounts` | Staff | List, filtered by `state` (`ACTIVE`, `EXPIRED`, `USED_UP`) | PS-19 | Yes |
| GET | `/discounts/:id` | Staff | Discount with products and usage | PS-19 | Yes |
| POST | `/discounts` | Admin | Create | PS-19 | Yes |
| PUT | `/discounts/:id` | Admin | Update or deactivate | PS-19 | Yes |



### Subscriptions (`modules/subscriptions`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/subscriptions` | Staff | List, filtered by `status`, `customerId`, `planId`, `q` | PS-12, PS-13 | ✓ |
| GET | `/subscriptions/:id` | Staff | Subscription with lines, totals and invoices | PS-12 | ✓ |
| GET | `/subscriptions/:id/activity` | Staff | Timeline | PS-13 | ✓ |
| POST | `/subscriptions` | Staff | Create a draft. `templateId` fills in the plan and lines | PS-11, PS-12 | |
| PUT | `/subscriptions/:id` | Staff | Update, in Draft or Quotation only | PS-12 | |
| POST | `/subscriptions/:id/quote` | Staff | Draft → Quotation, requires a line | PS-13 | ✓ |
| POST | `/subscriptions/:id/confirm` | Staff | Unexpired Quotation → Confirmed | PS-13 | ✓ |
| POST | `/subscriptions/:id/activate` | Staff | Confirmed → Active and schedule billing | PS-13 | ✓ |
| POST | `/subscriptions/:id/pause` | Staff | Active → Paused, if the plan allows | PS-14 | ✓ |
| POST | `/subscriptions/:id/resume` | Staff | Paused → Active at the next scheduled billing boundary | PS-14 | ✓ |
| POST | `/subscriptions/:id/renew` | Staff | Extend the same subscription with `{ expiryDate }`, if the plan allows | PS-14 | ✓ |
| POST | `/subscriptions/:id/close` | Staff | Close an Active or Paused subscription early, if the plan allows | PS-14 | ✓ |

### Billing and invoices (`modules/billing`, `modules/invoices`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/billing/due` | Staff | Subscriptions due, with a count and expected total | PS-15 |Yes |
| POST | `/billing/run` | Staff | Bill everything due. Returns `{ created, skipped, failed }` | PS-15, PS-16, PS-20 |Yes |
| POST | `/billing/subscriptions/:id` | Staff | Bill one subscription | PS-15 |Yes |
| GET | `/invoices` | Staff | List, filtered by `status`, `isOverdue`, `customerId`, `from`, `to`, `q` | PS-17, PS-22 | ✓ |
| GET | `/invoices/:id` | Staff | Invoice with lines and payments | PS-17 | ✓ |
| POST | `/invoices/:id/confirm` | Staff | Draft → Confirmed | PS-17 | ✓ |
| POST | `/invoices/confirm-all` | Staff | `{ invoiceIds }`: confirm in bulk | PS-17 |Yes |
| POST | `/invoices/:id/cancel` | Staff | Cancel if it has no payments. The period returns to the billing queue | PS-17 |Yes |
| POST | `/invoices/:id/send` | Staff | Emails the invoice and sets `sentAt`. Printing is done in the browser | PS-18 |Yes |

### Payments (`modules/payments`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/payments` | Staff | List, filtered by `method`, `from`, `to`, `q` | PS-21 | Yes |
| POST | `/payments` | Staff | `{ invoiceId, method, amount, paymentDate, note }` | PS-21, PS-22 | Yes |


### Reports (`modules/reports`)

| Method | Path | Roles | Purpose | Refs | Done |
|---|---|---|---|---|---|
| GET | `/reports/summary` | Staff | Active subscriptions, monthly recurring revenue, revenue, outstanding and overdue, for `from` and `to` | PS-23, PS-24 | ✓ |
| GET | `/reports/revenue` | Staff | Payments received by month, including months with no revenue | PS-24 | ✓ |
| GET | `/reports/renewals` | Staff | Active subscriptions expiring in 30 days or overdue for renewal | PS-23 | ✓ |
| GET | `/reports/events` | Staff | Server-Sent Events stream that signals committed invoice or payment changes | PS-28 | ✓ |

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

### POST /api/auth/login

Authenticate an active account. **Auth:** public. Refs: PS-2.

**Body:** `email` (valid email, at most 254 characters, trimmed and lowercased), `password` (required, at most 72 characters, preserved verbatim).

**Response** `200`: `{ token, user }`. Token expires after eight hours and carries the user ID, a signed passwordVersion and standard JWT timestamps. User includes `id`, `name`, `email`, `role`, `customerId`; no password hash.

**Responses:** `400` field validation; `401` identical message for unknown email, wrong password and inactive account.

### POST /api/auth/forgot-password

Request a recovery link. **Auth:** public. Refs: PS-3.

**Body:** email, valid and at most 254 characters, trimmed and lowercased. **Response:** 200 { message } for existing, unknown and inactive addresses. Links contain 32 random bytes and expire after 30 minutes. Only SHA-256 hashes are stored. SMTP delivery failures are logged while preserving the generic response. Without SMTP the existing sendMail helper prints the message in the terminal.

**Responses:** 400 fields.email for invalid input; 500 unexpected database failure.

### POST /api/auth/reset-password

Consume a recovery link once. **Auth:** public. Refs: PS-3.

**Body:** token (64 lowercase hexadecimal characters); password (same rule as signup: at least 9 characters, uppercase, lowercase and special character, at most 72 UTF-8 bytes).

**Responses:** 200 { message } instructing the user to log in; 400 field errors or invalid/expired/used link. The transaction serializes recovery for the account, changes the password, sets passwordChangedAt, and consumes all outstanding links. Previous sessions expire immediately, including tokens issued in the same second; new sessions remain valid. Standard JWT iat is preserved; an exact signed passwordVersion is compared with the current database passwordChangedAt on every request.

### GET /api/auth/me

Return `{ user }` with the same public fields as login. **Auth:** any active account. Refs: PS-2.

**Responses:** `200` current database identity; `401` missing, invalid or expired token, inactive user or session invalidated by password change. Roles and customer ownership are loaded from the database on every request.

### GET /api/health

Checks the API and the database connection. **Auth:** none.

**Responses:** `200` `{ "ok": true }` · `500` the database cannot be reached

### GET /api/reports/events

Open a staff-only Server-Sent Events stream. It sends `connected` once, then `changed` after an invoice or payment insert, update or delete commits in PostgreSQL. The event has no financial data; clients reload the relevant reports. The server sends heartbeat comments and removes the subscriber when the response closes. **Auth:** Admin, Internal. Refs: PS-28.

**Responses:** `200` an event stream · `401` not logged in · `403` not staff

### GET /api/reports/revenue

Return monthly revenue as payments received, aggregated by PostgreSQL. Every month in the selected range is present, including months with no payments. **Auth:** Admin, Internal. Refs: PS-24.

**Query** `from`, `to`: optional `YYYY-MM-DD` bounds. When omitted, the range defaults to the last 12 calendar months through today. `to` cannot be before `from`.

**Response** `200`: `{ period: { from, to }, items: [{ month, label, amount }] }`. `month` is `YYYY-MM`; money is in paise.

**Responses:** `200` the monthly totals · `400` invalid date (`fields.from`, `fields.to`) · `401` not logged in · `403` not staff

### GET /api/subscriptions/:id

Read one subscription with its customer, plan rules, payment terms, lines and invoice summaries. **Auth:** Admin, Internal. Refs: PS-12, PS-13.

**Responses:** `200` the subscription with `lines`, `invoices`, `customer`, `plan` and `paymentTerm` · `400` the id is not a positive integer · `401` not logged in · `403` not staff · `404` subscription not found

### GET /api/subscriptions/:id/activity

Read a subscription's activity timeline in chronological order, including the actor when recorded. Scheduler actions have a null actor and are displayed as System. **Auth:** Admin, Internal. Refs: PS-13.

**Response** `200`: an array of `{ id, action, detail, createdAt, actor }` entries.

**Responses:** `200` the timeline (an empty array when no activity exists) · `400` the id is not a positive integer · `401` not logged in · `403` not staff · `404` subscription not found

### POST /api/subscriptions/:id/quote

Move a draft subscription to Quotation. Requires at least one line. Quote expiry comes from the selected template's validity; without a template, validity defaults to 30 days. **Auth:** Admin, Internal. Refs: PS-13.

**Responses:** `200` the updated subscription · `400` invalid id · `401` not logged in · `403` not staff · `404` subscription not found · `409` the subscription is not a draft or has no lines

### POST /api/subscriptions/:id/confirm

Move an unexpired quotation to Confirmed. **Auth:** Admin, Internal. Refs: PS-13.

**Responses:** `200` the updated subscription · `400` invalid id · `401` not logged in · `403` not staff · `404` subscription not found · `409` the subscription is not a quotation or the quotation expired

### POST /api/subscriptions/:id/activate

Move a confirmed subscription to Active and set `nextInvoiceDate` to `startDate`. **Auth:** Admin, Internal. Refs: PS-13.

**Responses:** `200` the updated subscription · `400` invalid id · `401` not logged in · `403` not staff · `404` subscription not found · `409` the subscription is not confirmed

### POST /api/subscriptions/:id/pause and `/resume`

Pause is allowed for Active subscriptions only when the plan's `canPause` flag is enabled. A Paused subscription is excluded from billing. Resume requires Paused status and the same plan flag; its next invoice date advances on the original billing schedule to the first period boundary on or after today, so paused periods are not charged. **Auth:** Admin, Internal. Refs: PS-14, A-18.

**Responses:** `200` the updated subscription · `401` not logged in · `403` not staff · `404` subscription not found · `409` the plan disallows the action or the status is invalid

### POST /api/subscriptions/:id/renew

Extend the expiry date of the same Active subscription. The body is `{ "expiryDate": "YYYY-MM-DD" }`; the new date must be after both the current expiry and today. When billing had stopped at expiry, the next invoice date resumes at the next scheduled boundary derived from the last non-canceled invoice (or the subscription start date if none exists). The plan's `canRenew` flag must be enabled. **Auth:** Admin, Internal. Refs: PS-14, A-19.

**Responses:** `200` the updated subscription · `400` invalid date (`fields.expiryDate`) · `401` not logged in · `403` not staff · `404` subscription not found · `409` the plan disallows renewal or the subscription is not Active

### POST /api/subscriptions/:id/close

Close an Active or Paused subscription early when the plan's `canCloseEarly` flag is enabled. The next invoice date is cleared and future billing stops; existing invoices and history remain. The change is recorded as `CLOSED` with close reason `CLOSED_EARLY`. **Auth:** Admin, Internal. Refs: PS-14.

**Responses:** `200` the updated subscription · `401` not logged in · `403` not staff · `404` subscription not found · `409` the plan disallows early closing or the subscription status is invalid

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

### GET /api/invoices/:id

One invoice with its lines, payments, subscription and discount. **Auth:** Admin, Internal. Refs: PS-17.

**Response** `200`: the invoice with `lines` (description, quantity, `unitPrice`, `amount`, `discountAmount`, `taxName`, `taxRatePercent`, `taxAmount`), `payments` (newest first, with `recordedBy`), `subscription` (`id`, `number`), `discount` (`id`, `name`, or `null`), `balanceAmount` and `isOverdue`. Money is in paise.

**Responses:** `200` the invoice · `400` the id is not a number · `401` not logged in · `403` not staff · `404` invoice not found

### POST /api/invoices/:id/confirm

Confirm a draft invoice. **Auth:** Admin, Internal. Refs: PS-17.

The status is checked inside the update, so two people confirming at once cannot both succeed. The change is logged on the invoice and subscription timelines.

**Responses:** `200` the confirmed invoice, as in `GET /api/invoices/:id` · `400` the id is not a number · `401` not logged in · `403` not staff · `404` invoice not found · `409` the invoice is not a `DRAFT`
<!-- Add one entry per route, grouped by module, in the format from
docs/documentation-rules.md §5. Add it in the same commit as the route. -->

### Catalog read endpoints (PS-6, PS-8, PS-10, PS-12)

**Auth:** Admin and Internal for all six routes. Missing authentication returns
`401`; a Customer receives `403` before query validation.

#### GET `/api/taxes`

List tax identifiers, names, decimal-string rates and active flags. Refs: PS-10.

#### GET `/api/payment-terms`

List payment-term identifiers, names, due days and active flags. Refs: PS-12.

#### GET `/api/products`

List product identifiers, names, types, sales/cost prices, tax IDs and active
flags. Optional filters: `type` (SOFTWARE, ADD_ON, SERVICE), `isActive`. Refs: PS-6.

#### GET `/api/products/:id`

Read one product with notes, variants and plans; absent IDs return `404`.
Refs: PS-6, PS-7.

#### GET `/api/plans`

List plans with price, billing period, quantity, dates and behaviour switches.
Optional filters: `availableOn`, `isActive`. Refs: PS-8, PS-9.

#### GET `/api/plans/:id`

Read one plan; absent IDs return `404`. Refs: PS-8, PS-9.

#### Shared catalog query and response rules

Lists accept `page`, `pageSize` (maximum 50) and case-insensitive name search
`q` (maximum 100 characters). Filters combine with AND. `isActive` accepts
only the strings `true` or `false`; omission includes both states.
`availableOn` is a real calendar date in `YYYY-MM-DD` format and returns
active plans whose start date is on/before that day and whose end date is
null or on/after it. Both boundaries are inclusive. Dates in plan responses,
including product-detail plans, are `YYYY-MM-DD`; money remains integer paise.

**Responses:** `200` the record or standard paginated envelope; `400` invalid
query/ID with per-field messages; `401` unauthenticated; `403` wrong role;
`404` unknown product or plan. No schema or migration changes are required.
### Tax and payment-term writes (PS-10, PS-12)

**Auth:** Admin only. Internal and Customer users receive `403`.

#### POST `/api/taxes`

Create a tax rule. **Body:** `name` (trimmed, 1 to 60 characters), `ratePercent`
(number, 0 to 100 inclusive, at most two decimal places), optional `isActive`
(boolean, defaults to true). **Response:** `201` the saved rule. Refs: PS-10.

#### PUT `/api/taxes/:id`

Update a rule using the same body. Set `isActive: false` to deactivate it
without deleting history. **Response:** `200` the saved rule. Refs: PS-10.

#### POST `/api/payment-terms`

Create payment terms. **Body:** `name` (trimmed, 1 to 60 characters), `dueDays`
(integer, 0 to 2147483647), optional `isActive` (boolean, defaults to true).
**Response:** `201` the saved record. Refs: PS-12.

#### PUT `/api/payment-terms/:id`

Update payment terms using the same body. Deactivate with `isActive: false`;
records are never deleted by these routes. **Response:** `200`. Refs: PS-12.

**Errors for all four routes:** `400` invalid body or ID with field messages;
`401` unauthenticated; `403` wrong role; `409` duplicate name with
`fields.name`; update also returns `404` for an absent ID. No schema change.


### Product writes (PS-6)

#### POST `/api/products`

Create a product. **Auth:** Admin. **Body:** `name` (1 to 120 trimmed
characters), `type` (SOFTWARE, ADD_ON or SERVICE), `salesPrice` and `costPrice`
(integer paise, 0 to 1000000000), optional `notes` (up to 1000 characters
or null), optional `isActive` (boolean, default true). **Response:** `201`
the saved product. Refs: PS-6.

#### PUT `/api/products/:id`

Update a product with the same body. Deactivate using `isActive: false`
without deleting history. **Auth:** Admin. **Response:** `200` the saved
product. Refs: PS-6.

**Errors:** `400` invalid input with field messages; `401` unauthenticated;
`403` wrong role; `409` duplicate name with `fields.name`; update returns
`404` for an absent ID. Money remains whole paise. No schema change.
The product form component accepts prices in rupees, rejects negative,
non-finite, oversized or sub-paise input, then uses `toPaise` once before
submitting. The displayed margin is sales price minus cost price and is
not stored. The Products page wires the form to its filtered catalog list.

### Plan writes (PS-8, PS-9)

#### POST `/api/plans`

Create a plan. **Auth:** Admin. **Body:** `name` (1 to 120 trimmed characters),
`productId` (existing product), `price` (integer paise, 0 to 1000000000),
`billingPeriod` (DAILY, WEEKLY, MONTHLY, YEARLY), `minQuantity` (integer,
1 to 2147483647), `startDate` (YYYY-MM-DD), optional nullable `endDate`
(on/after startDate). Boolean defaults: `closesAtExpiry=false`,
`canCloseEarly=true`, `canPause=false`, `canRenew=true`, `isActive=true`.
**Response:** `201` the saved plan with product ID/name and date-only dates.

#### PUT `/api/plans/:id`

Update with the same body, including the intended behaviour switches.
**Auth:** Admin. **Response:** `200`. Reads now include product ID/name
for list display and editing without per-row API requests.

**Errors:** `400` invalid input, unknown product or reversed dates with
field messages; `401` unauthenticated; `403` wrong role; `409` duplicate
name with `fields.name`; update returns `404` for an absent plan. No schema
or migration change. Refs: PS-8, PS-9.

The plan form converts validated rupee prices to paise at submission, mirrors
quantity and date errors, and uses a paginated product picker. Existing
product selection remains available while browsing another product page.


### Product variants (PS-7)

**Auth:** Admin for all writes. Product/variant IDs are validated and updates
and removals are scoped to the parent product.

#### POST `/api/products/:id/variants`

**Body:** `attribute` and `value` (trimmed, 1 to 60 characters), `extraPrice`
(integer paise, 0 to 1000000000). **Response:** `201` the variant.

#### PUT `/api/products/:id/variants/:variantId`

Update with the same body. **Response:** `200` the saved variant.

#### DELETE `/api/products/:id/variants/:variantId`

Remove an unused variant. **Response:** `204`. Used subscription variants
return `409` explaining why they cannot be removed. The check and delete
run inside one transaction with a variant-row lock, preventing a race
with concurrent foreign-key references.

**Errors:** `400` invalid body/IDs with fields; `401` unauthenticated;
`403` wrong role; `404` missing parent/variant or mismatched parent;
`409` duplicate product/attribute/value with `fields.value`, or used removal.
No schema or migration changes.

The Plans page connects the validated form with URL-backed name, active-state
and available-on filters; it displays product names, prices, billing periods
and sale dates from paginated API results. Internal staff have read-only UI.

### GET /api/payments

Search payments with combined filters. **Auth:** Admin, Internal. Refs: PS-21.

**Query:** page/pageSize use standard pagination; method is a native PaymentMethod enum; from/to are optional valid YYYY-MM-DD inclusive payment-date bounds; to must be on or after from; q at most 100 characters matches invoice number, billing name or note case-insensitively. All supplied filters combine with AND.

**Response:** 200 { items, total, page, pageSize, pages }, ordered by payment date then ID descending. Items include payment fields, invoice { id, number, billingName } and recordedBy { id, name }. Amounts are paise.

**Responses:** 400 invalid filters with field errors; 401 unauthenticated; 403 customer. Empty searches return an empty items array, not an error. Each UI row links to its invoice detail.


### Billing execution (PS-15)

`POST /api/billing/run` bills all due active subscriptions in batches of 100 IDs.
`POST /api/billing/subscriptions/:id` bills one existing subscription.
Both require Admin/Internal, accept an empty JSON object, and use today's IST
business date. Responses are `{ created, skipped, failed }`, counted per period.
A second run creates nothing. Missing single-subscription IDs return `404`;
invalid IDs/bodies return `400`, missing authentication `401`, customers `403`.
Each period locks its subscription, snapshots active lines and taxes, creates a
Draft invoice, advances its cursor and logs the actor in one transaction.
Failures roll back the period and do not stop later subscriptions. Financial
amounts that exceed PostgreSQL limits fail without moving the cursor.


Billing automatically chooses the eligible discount with the largest saving,
with the lower rule ID breaking ties. Date bounds are inclusive. A conditional
count/version update claims one use per invoice; if another transaction takes
that use, the invoice is recalculated without that rule. The usage increment
rolls back with invoice creation. Product-scoped rules cover only their products.


### GET /api/billing/due

**Auth:** Admin/Internal. Standard `q`, `page`, `pageSize` validation and
pagination apply. Returns `{ items, total, page, pageSize, pages,
expectedSubtotalAmount }`. Search matches subscription number or customer name.
The database sums recurring pre-tax amounts for one next period per matching
subscription. The UI labels this as an estimate before tax/discount and explains
that catch-up can create multiple invoices. Run billing always processes the
whole queue, including rows outside the current filter.


### POST /api/invoices/:id/cancel

**Auth:** Admin/Internal. Returns the updated invoice. `404` for absent records,
`400` for invalid IDs and `409` for paid/canceled invoices or any payment history.
In one transaction, lock the subscription and invoice, cancel once, return one
discount usage, rewind the cursor if necessary and write the timeline. Paused or
closed subscriptions retain their status and remain excluded from billing.


### POST /api/invoices/:id/send

**Auth:** Admin/Internal. Send snapshot line items, dates, totals and balance to
the customer's current registered email through the existing mail helper.
Returns `200` with the updated invoice and `sentAt`; `404` missing, `400` invalid
ID, `502` mail delivery failure with a clear retry message. Failed delivery does
not set `sentAt` or log success. Without SMTP, the same message is printed in the
server terminal. Successful delivery updates `sentAt` and logs `SENT` together.
SMTP delivery and database recording are separate operations; after a database
failure, check delivery before retrying to avoid duplicate mail.
Invoice detail provides a print action; print styles hide navigation and actions.


### POST /api/invoices/confirm-all

**Auth:** Admin/Internal. Body `{ invoiceIds }`: 1–100 distinct positive integer
IDs, bounded to PostgreSQL identifiers. Invalid or duplicate IDs return `400`.
Returns `{ confirmed, skipped, failed }`. Each Draft is confirmed through the
same transaction/audit rules as the individual action. Stale/non-Draft and
missing invoices count as skipped. Unexpected errors count as failed and are
logged without preventing later IDs. The list selects only current-page Drafts,
disables pending controls and shows the result counts.


### Scheduled subscription processing (PS-14, PS-15)

At API startup and hourly, process due Confirmed → Active transitions, close
expired Active subscriptions only when their plan has `closesAtExpiry`, then run
billing. Other expired subscriptions remain Active and period starts at/after
expiry are never billed. Transitions are conditional, paginated in batches of 100,
and audited with no actor for system work. Phase/record failures are logged and
do not stop the server or later phases. In-process runs never overlap; database
state guards and billing locks handle multiple API instances. Shutdown stops the
timer and waits for in-flight work before disconnecting PostgreSQL.

### Quotation templates (PS-11)

**Auth:** Staff reads; Admin writes (A-7). No new schema or migrations.

#### GET /api/templates

Paginated, case-insensitive name search through `q`. Returns template summaries,
the plan and `_count.lines`. Uses the shared page and pageSize limits.

#### GET /api/templates/:id

Returns the template with ordered lines, product/variant names and current
`unitPrice` in paise. The plan price replaces its own product's sales price;
other lines use sales price, then add the variant extra price (A-5). No prices
are stored on templates or their lines.

#### POST /api/templates / PUT /api/templates/:id

| Field | Type | Rules |
|---|---|---|
| name | string | Trimmed, 1-120 characters, unique |
| planId | number | Existing plan |
| validityDays | number | Integer, 1-2147483647 |
| notes | string/null | Optional, at most 1000 characters |
| isActive | boolean | Default true; deactivate to retain history |
| lines | array | 1-100 lines, replaced atomically on update |
| lines[].productId | number | Existing product |
| lines[].variantId | number/null | Optional; must belong to the selected product |
| lines[].quantity | number | Integer, 1-2147483647 |

Responses: `201` created, `200` updated; `400` invalid fields (line keys such as
`lines.0.variantId`), `401` unauthenticated, `403` forbidden, `404` missing
template, `409` duplicate name or concurrently removed catalog references.
Line inputs reject price fields rather than accepting a stale snapshot.
The Quotation templates page supports URL-backed name search, pagination,
Admin-only editing and staff previews with current prices. The editor converts
no prices into snapshots. Subscription creation from a template remains a
separately owned workflow; PS-11 stays In progress until that integration.



### POST /api/auth/register

Create a CUSTOMER account and customer profile, or link the unclaimed profile with the same normalized email (A-4). **Auth:** public. Refs: PS-1, PS-5.

**Body:** name (required, at most 120 characters); email (valid, at most 254 characters, normalized); password (at least 9 characters with uppercase, lowercase and special character; at most 72 UTF-8 bytes). A digit is not required. Caller-supplied role and unknown properties are ignored. Each failed password rule appears on its own line in fields.password.

**Responses:** 201 { token, user }; 400 per-field validation; 409 duplicate account or already claimed profile (fields.email). Creation/linking is one transaction and the role is always CUSTOMER. Password hashes are never returned. Token format and eight-hour expiry use the shared auth helper.


### GET /api/customers

Search name, company and email case-insensitively with q (at most 100 characters). Standard page/pageSize pagination applies. **Auth:** Admin, Internal. Refs: PS-12.

**Responses:** 200 { items, total, page, pageSize, pages }; 400 invalid query; 401 unauthenticated; 403 customer.

### POST /api/customers

Create a customer without creating a login. **Auth:** Admin, Internal. Refs: PS-12.

**Body:** name required, at most 120 characters; email required, valid and at most 254; companyName optional, at most 160; phone optional, a 10-digit Indian mobile starting 6–9; address optional, at most 500; isActive boolean, defaults true. Strings are trimmed and emails lowercased.

**Responses:** 201 customer; 400 field validation; 409 duplicate customer email with fields.email; 401/403 unauthorized.

### GET /api/customers/:id

Return the customer plus subscriptions and invoices grouped by status. Each summary contains _count._all and database-side _sum values (recurringAmount for subscriptions; totalAmount/paidAmount for invoices). Money is paise. **Auth:** Admin, Internal. Refs: PS-12.

**Responses:** 200 profile and summaries; 400 invalid ID; 404 missing customer; 401/403 unauthorized.

### PUT /api/customers/:id

Replace the editable customer fields using the POST body rules. Does not modify a linked login. **Auth:** Admin, Internal. Refs: PS-12.

**Responses:** 200 customer; 400 field validation; 404 missing customer; 409 duplicate email (fields.email); 401/403 unauthorized.


### POST /api/payments

Record payment against a CONFIRMED invoice. **Auth:** Admin, Internal. Refs: PS-21, PS-22.

**Body:** invoiceId positive integer; method CASH/BANK_TRANSFER/UPI/CARD/CHEQUE; amount positive whole paise at most 1,000,000,000 and not above balance; paymentDate valid YYYY-MM-DD not after today in IST; note optional, at most 500 characters.

**Response:** 201 { payment, invoice }, including invoice.balanceAmount. Part payments leave CONFIRMED; full settlement sets PAID and paidAt. Row locking serializes concurrent requests. Payment insertion, balance update and PAYMENT_RECORDED activity happen in one transaction.

**Responses:** 400 field validation or overpayment (fields.amount states current balance); 404 invoice missing; 409 invoice not CONFIRMED; 401 unauthenticated; 403 customer. The invoice-detail form converts rupees to paise at the UI boundary and refreshes invoice/payment history after success.

### GET /api/staff

List INTERNAL accounts with standard pagination and q search over name/email. **Auth:** Admin only. Refs: PS-5.

**Responses:** 200 paginated public account fields; 400 query validation; 401 unauthenticated; 403 Internal/Customer. Password hashes are never returned.

### POST /api/staff

Create an INTERNAL account; caller-supplied role is ignored. **Auth:** Admin only. Refs: PS-5.

**Body:** name required, at most 120; email required, valid, at most 254, normalized; password follows signup (9+ characters, uppercase/lowercase/special, at most 72 UTF-8 bytes); isActive boolean defaults true.

**Responses:** 201 public account; 400 per-field validation; 409 duplicate email (fields.email); 401/403 unauthorized.

### PATCH /api/staff/:id

Update an INTERNAL account. Name/email/isActive use POST rules; password is optional and when present must satisfy the same rule. Admin and Customer records cannot be edited here. **Auth:** Admin only. Refs: PS-5.

**Responses:** 200 public account; 400 validation; 404 missing/non-staff account; 409 duplicate email (fields.email); 401/403 unauthorized. Deactivation takes effect on the next authenticated request. Password changes update passwordChangedAt monotonically under an account lock. The precise signed passwordVersion must equal the current database version, ending older sessions immediately.

### Discount catalog reads (PS-19, A-24)

#### GET /api/discounts

**Auth:** Staff. Shared pagination and case-insensitive name search `q`.
Optional `state`: ACTIVE, EXPIRED, USED_UP, SCHEDULED or INACTIVE.
Filtering/counting happens in PostgreSQL before pagination, including usage
count versus limit. Returns records with current derived state and products.

State precedence: disabled is Inactive; past end date is Expired; a reached
non-null limit is Used up; future start date is Scheduled; otherwise Active.
Business dates use IST and both boundaries are inclusive. The user approved
the Scheduled/Inactive labels; no new database state column is introduced.

#### GET /api/discounts/:id

**Auth:** Staff. Returns the rule, linked products, read-only usage count,
numeric percentage and dates as YYYY-MM-DD.

Responses: `200`; `400` invalid query/ID, `401` unauthenticated, `403`
not staff, `404` missing discount. No schema or migration changes.
### Discount writes (PS-19)

#### POST /api/discounts / PUT /api/discounts/:id

**Auth:** Admin. Responses: `201` created or `200` updated with derived state
and linked products. Product links are replaced atomically on update.

| Field | Type | Rules |
|---|---|---|
| name | string | Trimmed, 1-120 characters, unique |
| type | string | FIXED or PERCENT |
| fixedAmount | number/null | Positive integer paise up to 1000000000 for FIXED; null otherwise |
| percent | number/null | Above 0, at most 100, up to 2 decimals for PERCENT; null otherwise |
| scope | string | PRODUCT or SUBSCRIPTION |
| productIds | array | 1-100 distinct existing IDs for PRODUCT; empty for SUBSCRIPTION |
| minPurchaseAmount | number | Integer paise, 0-1000000000, default 0 |
| minQuantity | number | Integer, 0-2147483647, default 0 |
| startDate / endDate | string | YYYY-MM-DD; end on/after start |
| usageLimit | number/null | Integer, 1-2147483647; null means unlimited |
| isActive | boolean | Default true; deactivate to retain history |

`usageCount` is read-only and rejected in input. A row lock serializes updates
with billing claims; the limit cannot be lower than the current usage count.

Errors: `400` field errors or invalid/read-only input, `401` unauthenticated,
`403` not Admin, `404` missing discount, `409` duplicate name with
`fields.name` or concurrently removed product choices. No schema changes.

