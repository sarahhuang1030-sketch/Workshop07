ALTER TABLE invoices ADD COLUMN quote_id INT;

ALTER TABLE quotes ADD COLUMN invoice_id INT;

ALTER TABLE invoices ADD COLUMN source VARCHAR(50);
ALTER TABLE invoices ADD COLUMN lifecycle_stage VARCHAR(50);