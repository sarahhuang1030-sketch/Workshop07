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