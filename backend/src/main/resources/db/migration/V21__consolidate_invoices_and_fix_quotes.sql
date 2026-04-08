-- V21: Consolidate 'invoices' table and fix relationship between 'quotes' and 'plans'

-- 1. Remove redundant columns from 'invoices' table as they were merged into 'lifecycle_stage', 'promo_code', etc.
ALTER TABLE invoices DROP COLUMN Status;
ALTER TABLE invoices DROP COLUMN promoCode;
ALTER TABLE invoices DROP COLUMN StripePaymentIntentId;

-- 2. Establish relationship between 'quotes' and 'plans'
-- (Note: 'plan_id' was added to 'quotes' in V20, but the constraint was missing)
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_plan FOREIGN KEY (plan_id) REFERENCES plans (PlanId);

-- 3. Add foreign key for 'quote_id' in 'invoices'
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_quote FOREIGN KEY (quote_id) REFERENCES quotes (id);
