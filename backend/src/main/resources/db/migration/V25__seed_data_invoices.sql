INSERT INTO invoices (CustomerId, InvoiceNumber, Status, IssueDate, DueDate, subtotal, taxTotal, total)
VALUES
    (1, 'INV-001', 'Unpaid',   '2026-03-01', '2026-03-31', 85.00,  12.75, 97.75),
    (1, 'INV-002', 'Paid',     '2026-03-05', '2026-04-04', 120.00, 18.00, 138.00),
    (2, 'INV-003', 'Unpaid',   '2026-02-15', '2026-03-15', 55.00,  8.25,  63.25),
    (3, 'INV-004', 'Approved', '2026-04-01', '2026-04-30', 200.00, 30.00, 230.00),
    (2, 'INV-005', 'Unpaid',   '2026-01-10', '2026-02-10', 75.00,  11.25, 86.25);

UPDATE invoices SET Status = 'UNPAID' WHERE InvoiceNumber IN ('INV-001', 'INV-003', 'INV-005');
UPDATE invoices SET Status = 'PAID'    WHERE InvoiceNumber = 'INV-002';
UPDATE invoices SET Status = 'APPROVED' WHERE InvoiceNumber = 'INV-004';


INSERT INTO invoiceitems (InvoiceId, description, quantity, unitPrice, lineTotal, itemType, serviceType, discountAmount)
VALUES
    (1, 'Basic Mobile Plan',    1, 85.00,  85.00,  'plan', 'Mobile',   0.00),
    (2, 'Unlimited 5G Plan',    1, 120.00, 120.00, 'plan', 'Mobile',   0.00),
    (3, 'Home Internet Plan',   1, 55.00,  55.00,  'plan', 'Internet', 0.00),
    (4, 'Business Pro Plan',    1, 200.00, 200.00, 'plan', 'Mobile',   0.00),
    (5, 'Home Internet Plan',   1, 75.00,  75.00,  'plan', 'Internet', 0.00);