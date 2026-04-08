-- V21: Consolidate 'invoices' table and fix relationship between 'quotes' and 'plans'

-- 1. Remove redundant columns from 'invoices' table as they were merged into 'lifecycle_stage', 'promo_code', etc.
-- Note: We only drop them if they exist and are redundant to the new schema defined in V17 and Invoices.java
ALTER TABLE invoices DROP COLUMN Status;
ALTER TABLE invoices DROP COLUMN promoCode;
ALTER TABLE invoices DROP COLUMN StripePaymentIntentId;

-- 2. Add 'plan_id' to 'quotes' table to establish relationship with plans
ALTER TABLE quotes ADD COLUMN plan_id INT;
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_plan FOREIGN KEY (plan_id) REFERENCES plans (PlanId);

-- 3. Add foreign key for 'quote_id' in 'invoices'
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_quote FOREIGN KEY (quote_id) REFERENCES quotes (id);
