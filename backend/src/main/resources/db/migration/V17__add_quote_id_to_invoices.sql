-- =========================
-- Quote relations
-- =========================
ALTER TABLE invoices ADD COLUMN quote_id INT;
ALTER TABLE quotes ADD COLUMN invoice_id INT;

-- =========================
-- Invoice metadata
-- =========================
ALTER TABLE invoices ADD COLUMN source VARCHAR(50);
ALTER TABLE invoices ADD COLUMN lifecycle_stage VARCHAR(50);

-- =========================
-- Billing & promotions
-- =========================
ALTER TABLE invoices ADD COLUMN promo_code VARCHAR(255);

-- =========================
-- Stripe
-- =========================
ALTER TABLE invoices ADD COLUMN stripe_payment_intent_id VARCHAR(255);