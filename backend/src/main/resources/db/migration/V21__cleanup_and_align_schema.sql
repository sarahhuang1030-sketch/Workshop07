-- =========================================================
-- V21: Cleanup redundant columns and add missing constraints
-- =========================================================

-- 1) Remove redundant/deprecated columns from invoices
-- These were replaced by lifecycle_stage, promo_code, and stripe_payment_intent_id in V17
ALTER TABLE invoices
    DROP COLUMN Status,
    DROP COLUMN promoCode,
    DROP COLUMN StripePaymentIntentId;

-- 2) Add missing Foreign Key for quotes.plan_id
-- plan_id was added in V20 but without a constraint
ALTER TABLE quotes
    ADD CONSTRAINT fk_quotes_plan
    FOREIGN KEY (plan_id) REFERENCES plans(PlanId);

-- 3) Add Quote <-> Invoice relations (missing since V17)
ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_quote
    FOREIGN KEY (quote_id) REFERENCES quotes(id);
