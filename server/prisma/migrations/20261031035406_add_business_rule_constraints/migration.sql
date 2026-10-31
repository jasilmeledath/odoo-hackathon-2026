-- Business rules the database enforces itself, so a bug in application code
-- cannot store an impossible record. Prisma cannot express CHECK constraints or
-- partial indexes in schema.prisma, so they live in this migration.
-- docs/data-model.md lists each one with its reason.

-- People
ALTER TABLE users ADD CONSTRAINT users_email_lowercase_check CHECK (email = lower(email));
ALTER TABLE customers ADD CONSTRAINT customers_email_lowercase_check CHECK (email = lower(email));

-- Catalog
ALTER TABLE taxes ADD CONSTRAINT taxes_rate_percent_check CHECK (rate_percent BETWEEN 0 AND 100);
ALTER TABLE payment_terms ADD CONSTRAINT payment_terms_due_days_check CHECK (due_days >= 0);
ALTER TABLE products ADD CONSTRAINT products_prices_check CHECK (sales_price >= 0 AND cost_price >= 0);
ALTER TABLE product_variants ADD CONSTRAINT product_variants_extra_price_check CHECK (extra_price >= 0);
ALTER TABLE plans ADD CONSTRAINT plans_price_check CHECK (price >= 0);
ALTER TABLE plans ADD CONSTRAINT plans_min_quantity_check CHECK (min_quantity >= 1);
ALTER TABLE plans ADD CONSTRAINT plans_dates_check CHECK (end_date IS NULL OR end_date >= start_date);

-- Quotations and subscriptions
ALTER TABLE quotation_templates ADD CONSTRAINT quotation_templates_validity_days_check CHECK (validity_days >= 1);
ALTER TABLE quotation_template_lines ADD CONSTRAINT quotation_template_lines_quantity_check CHECK (quantity >= 1);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_dates_check CHECK (expiry_date > start_date);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_amounts_check
  CHECK (recurring_amount >= 0 AND monthly_recurring_amount >= 0);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_closed_state_check
  CHECK ((status = 'CLOSED') = (closed_at IS NOT NULL));
ALTER TABLE subscription_lines ADD CONSTRAINT subscription_lines_quantity_check CHECK (quantity >= 1);
ALTER TABLE subscription_lines ADD CONSTRAINT subscription_lines_amount_check
  CHECK (unit_price >= 0 AND amount = quantity * unit_price);

-- Discounts: a rule is either a fixed amount or a percentage, never both
ALTER TABLE discounts ADD CONSTRAINT discounts_value_check CHECK (
  (type = 'FIXED' AND fixed_amount > 0 AND percent IS NULL)
  OR (type = 'PERCENT' AND percent > 0 AND percent <= 100 AND fixed_amount IS NULL)
);
ALTER TABLE discounts ADD CONSTRAINT discounts_dates_check CHECK (end_date >= start_date);
ALTER TABLE discounts ADD CONSTRAINT discounts_minimums_check CHECK (min_purchase_amount >= 0 AND min_quantity >= 0);
ALTER TABLE discounts ADD CONSTRAINT discounts_usage_check
  CHECK (usage_count >= 0 AND (usage_limit IS NULL OR (usage_limit >= 1 AND usage_count <= usage_limit)));

-- Invoices
ALTER TABLE invoices ADD CONSTRAINT invoices_dates_check
  CHECK (due_date >= issue_date AND period_end_date >= period_start_date);
ALTER TABLE invoices ADD CONSTRAINT invoices_discount_amount_check CHECK (discount_amount BETWEEN 0 AND subtotal_amount);
ALTER TABLE invoices ADD CONSTRAINT invoices_tax_amount_check CHECK (tax_amount >= 0);
ALTER TABLE invoices ADD CONSTRAINT invoices_total_amount_check
  CHECK (total_amount = subtotal_amount - discount_amount + tax_amount);
ALTER TABLE invoices ADD CONSTRAINT invoices_paid_amount_check CHECK (paid_amount BETWEEN 0 AND total_amount);
ALTER TABLE invoices ADD CONSTRAINT invoices_paid_status_check CHECK (status <> 'PAID' OR paid_amount = total_amount);

-- PS-15: one live invoice per subscription and period. Two billing runs at the
-- same moment cannot both win, and a canceled invoice frees its period to be billed again.
CREATE UNIQUE INDEX invoices_one_per_period_key
  ON invoices (subscription_id, period_start_date)
  WHERE status <> 'CANCELED';

ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_quantity_check CHECK (quantity >= 1);
ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_amount_check
  CHECK (unit_price >= 0 AND amount = quantity * unit_price);
ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_discount_amount_check CHECK (discount_amount BETWEEN 0 AND amount);
ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_tax_amount_check CHECK (tax_amount >= 0);

-- Payments
ALTER TABLE payments ADD CONSTRAINT payments_amount_check CHECK (amount > 0);

-- Support
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_target_check
  CHECK (subscription_id IS NOT NULL OR invoice_id IS NOT NULL);
ALTER TABLE document_counters ADD CONSTRAINT document_counters_value_check CHECK (value >= 0);
