-- add invoice_id into Payments table
ALTER TABLE payments ADD COLUMN invoice_id INT;

-- add subscription_id into invoices table
ALTER TABLE invoices ADD COLUMN subscription_id INT NULL;