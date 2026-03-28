ALTER TABLE subscriptions
    ADD COLUMN SoldByEmployeeId INT NULL;

ALTER TABLE subscriptions
    ADD CONSTRAINT FK_Subscriptions_Employee
        FOREIGN KEY (SoldByEmployeeId) REFERENCES employees(EmployeeId)
            ON DELETE SET NULL;

UPDATE subscriptions
SET SoldByEmployeeId = 5
WHERE SubscriptionId = 1;

UPDATE subscriptions
SET SoldByEmployeeId = 8
WHERE SubscriptionId = 2;

INSERT INTO subscriptions
(CustomerId, PlanId, StartDate, Status, BillingCycleDay, SoldByEmployeeId)
VALUES
    (1, 1, '2024-03-01', 'Active', 5, 2),
    (2, 2, '2024-03-05', 'Active', 10, 2),

    (3, 3, '2024-03-10', 'Active', 15, 5),
    (4, 4, '2024-03-12', 'Active', 20, 5),

    (5, 6, '2024-03-15', 'Active', 25, 8),
    (6, 7, '2024-03-18', 'Active', 12, 8),

    (1, 8, '2024-03-20', 'Active', 8, 2),
    (2, 9, '2024-03-22', 'Active', 18, 5);

INSERT INTO subscriptionaddons
(SubscriptionId, AddOnId, StartDate, Status)
VALUES
    (1, 1, '2024-03-01', 'Active'),
    (1, 2, '2024-03-01', 'Active'),

    (2, 3, '2024-03-05', 'Active'),

    (3, 4, '2024-03-10', 'Active'),
    (3, 5, '2024-03-10', 'Active'),

    (4, 6, '2024-03-12', 'Active'),

    (5, 7, '2024-03-15', 'Active'),
    (6, 8, '2024-03-18', 'Active'),

    (7, 9, '2024-03-20', 'Active'),

    (8, 10, '2024-03-22', 'Active');