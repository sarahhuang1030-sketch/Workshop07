INSERT INTO servicetypes (ServiceTypeId, Name, Description) VALUES
                                                                (1, 'Mobile', 'Mobile phone services'),
                                                                (2, 'Internet', 'Home internet services');

INSERT INTO locations (LocationId, LocationName, LocationType, Street1, Street2, City, Province, PostalCode, Country, Phone, IsActive) VALUES
                                                                                                                                           (1, 'Downtown Sales Office', 'SalesPoint', NULL, NULL, 'Calgary', 'AB', NULL, 'Canada', '403-555-1000', 1),
                                                                                                                                           (2, 'North Warehouse', 'Warehouse', NULL, NULL, 'Calgary', 'AB', NULL, 'Canada', '403-555-2000', 1),
                                                                                                                                           (3, 'Head Office', 'Office', NULL, NULL, 'Calgary', 'AB', NULL, 'Canada', '403-555-3000', 1);

INSERT INTO customers (CustomerId, CustomerType, FirstName, LastName, BusinessName, Email, HomePhone, Status, CreatedAt, PasswordHash, ExternalCustomerId, ExternalProvider) VALUES
                                                                                                                                                                                 (1, 'Individual', 'John', 'Doe', NULL, 'john.doe@email.com', '403-444-4444', 'Active', NOW(), '', NULL, NULL),
                                                                                                                                                                                 (2, 'Business', NULL, NULL, 'Acme Inc.', 'info@acmeinc.com', '403-555-5555', 'Active', NOW(), '', NULL, NULL),
                                                                                                                                                                                 (3, 'Individual', 'Sarah', 'Chen', NULL, 'sarah.chen@email.com', '403-666-6666', 'Active', NOW(), '', NULL, NULL),
                                                                                                                                                                                 (4, 'Individual', 'Mike', 'Smith', NULL, 'mike.smith@email.com', '403-777-7777', 'Active', NOW(), '', NULL, NULL),
                                                                                                                                                                                 (5, 'Individual', 'Emma', 'Brown', NULL, 'emma.brown@email.com', '403-888-8888', 'Active', NOW(), '', NULL, NULL),
                                                                                                                                                                                 (6, 'Business', NULL, NULL, 'Tech Solutions Ltd.', 'contact@techsolutions.com', '403-999-9999', 'Active', NOW(), '', NULL, NULL);

INSERT INTO employees (EmployeeId, PrimaryLocationId, ReportsToEmployeeId, FirstName, LastName, Email, Phone, PositionTitle, Salary, HireDate, Status, Active, ManagerId) VALUES
                                                                                                                                                                              (1, 3, NULL, 'Alice', 'Managers', 'alice.manager@email.com', '403-111-1111', 'Manager', 85000.00, '2022-01-15', 'Active', 1, NULL),
                                                                                                                                                                              (2, 1, NULL, 'Bob', 'Agent', 'bob.agent@email.com', '403-222-2222', 'Sales Agent', 55000.00, '2023-03-01', 'Active', 1, NULL),
                                                                                                                                                                              (3, 1, NULL, 'Charlie', 'Tech', 'charlie.tech@email.com', '403-333-3333', 'Service Technician', 60000.00, '2023-06-10', 'Active', 1, NULL),
                                                                                                                                                                              (4, 1, NULL, 'David', 'Support', 'david.support@email.com', '403-444-0000', 'Manager', 50000.00, '2023-07-01', 'Active', 1, NULL),
                                                                                                                                                                              (5, 1, NULL, 'Ethan', 'Sales', 'ethan.sales@email.com', '403-555-0000', 'Senior Sales Agent', 65000.00, '2023-08-01', 'Active', 1, NULL),
                                                                                                                                                                              (6, 2, NULL, 'Fiona', 'Warehouse', 'fiona.warehouse@email.com', '403-666-0000', 'Service Technician', 48000.00, '2023-09-01', 'Active', 1, NULL),
                                                                                                                                                                              (7, 2, NULL, 'George', 'Logistics', 'george.logistics@email.com', '403-777-0000', 'Manager', 52000.00, '2023-10-01', 'Active', 1, NULL),
                                                                                                                                                                              (8, 1, NULL, 'Hannah', 'Sales', 'hannah.sales@email.com', '403-888-0000', 'Sales Agent', 58000.00, '2023-11-01', 'Active', 1, NULL),
                                                                                                                                                                              (9, 2, NULL, 'Githa', 'Sembal', 'githa.sembal@email.com', '403-3333-7777', 'Service Technician', 78000.00, '2025-09-08', 'Active', 1, NULL);                                         ;

INSERT INTO useraccounts (UserId, CustomerId, EmployeeId, Username, PasswordHash, Role, IsLocked, LastLoginAt, AvatarUrl) VALUES
                                                                                                                              (1, NULL, 1, 'alice.manager', 'Password123', 'Manager', 0, '2026-03-12 21:52:01', NULL),
                                                                                                                              (2, NULL, 2, 'bob.agent', 'Password123', 'SalesAgent', 0, '2026-03-12 19:46:35', NULL),
                                                                                                                              (3, NULL, 3, 'charlie.tech', 'Password123', 'ServiceTechnician', 0, '2026-03-04 20:30:43', NULL),
                                                                                                                              (4, 1, NULL, 'john.customer', 'Password123', 'Customer', 0, NULL, NULL);

INSERT INTO customeraddresses (AddressId, CustomerId, AddressType, Street1, Street2, City, Province, PostalCode, Country, IsPrimary) VALUES
                                                                                                                                         (1, 1, 'Billing', '123 Main St', NULL, 'Calgary', 'AB', 'T2P 1A1', 'Canada', 1),
                                                                                                                                         (2, 1, 'Service', '123 Main St', NULL, 'Calgary', 'AB', 'T2P 1A1', 'Canada', 1),
                                                                                                                                         (3, 2, 'Billing', '456 Industrial Rd', NULL, 'Calgary', 'AB', 'T3A 2B2', 'Canada', 1),
                                                                                                                                         (4, 3, 'Billing', '789 River Rd', NULL, 'Calgary', 'AB', 'T2N 2N2', 'Canada', 1);

INSERT INTO addons (AddOnId, ServiceTypeId, AddOnName, MonthlyPrice, Description, IsActive, IconKey, ThemeKey) VALUES
                                                                                                                   (1, 1, 'Extra 10GB Data', 12.00, 'Adds 10GB high-speed data per month.', 1, NULL, NULL),
                                                                                                                   (2, 1, 'Device Protection', 9.00, 'Covers accidental damage and replacement options.', 1, NULL, NULL),
                                                                                                                   (3, 1, 'Roaming Bundle', 15.00, 'Discounted roaming in US/Mexico.', 1, NULL, NULL),
                                                                                                                   (4, 1, 'International Calling', 10.00, 'Low-cost international calling to 50+ countries.', 1, NULL, NULL),
                                                                                                                   (5, 1, 'Premium Voicemail', 4.00, 'Voicemail-to-text and extended mailbox storage.', 1, NULL, NULL),
                                                                                                                   (6, 2, 'Wi-Fi Extender', 5.00, 'Extends Wi-Fi coverage to eliminate dead zones.', 1, NULL, NULL),
                                                                                                                   (7, 2, 'Mesh Wi-Fi Kit', 10.00, 'Whole-home mesh Wi-Fi coverage kit.', 1, NULL, NULL),
                                                                                                                   (8, 2, 'Static IP', 8.00, 'Fixed IP for remote access / servers.', 1, NULL, NULL),
                                                                                                                   (9, 2, 'Premium Support', 5.00, 'Priority troubleshooting + faster dispatch.', 1, NULL, NULL),
                                                                                                                   (10, 2, 'Parental Controls', 4.00, 'Content filtering + time limits for devices.', 1, NULL, NULL);

INSERT INTO plans (PlanId, ServiceTypeId, PlanName, MonthlyPrice, ContractTermMonths, Description, IsActive, Tagline, Badge, IconKey, ThemeKey, DataLabel) VALUES
                                                                                                                                                               (1, 1, 'Mobile Starter 30', 30.00, 12, 'Good starter plan for everyday use.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (2, 1, 'Mobile Value 45', 45.00, 12, 'Great value plan with plenty of data.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (3, 1, 'Unlimited Mobile 50', 50.00, 24, 'Unlimited talk & text with solid data.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (4, 1, 'Mobile Plus 65', 65.00, 24, 'High-speed data + hotspot for heavy use.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (5, 1, 'Mobile Premium 85', 85.00, 24, 'Premium plan with best perks and roaming.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (6, 2, 'Internet 100', 55.00, 12, '100 Mbps for browsing, school, and streaming.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (7, 2, 'Fibre 300', 75.00, 12, '300 Mbps for multi-device households.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (8, 2, 'Internet 500', 85.00, 12, '500 Mbps for streaming + work from home.', 1, NULL, NULL, NULL, NULL, NULL),
                                                                                                                                                               (9, 2, 'Gigabit 1000', 110.00, 24, '1 Gbps for power users, gamers, and creators.', 1, NULL, NULL, NULL, NULL, NULL);

INSERT INTO subscriptions (SubscriptionId, CustomerId, PlanId, StartDate, EndDate, Status, BillingCycleDay, Notes) VALUES
                                                                                                                       (1, 3, 3, '2024-01-01', NULL, 'Active', 1, NULL),
                                                                                                                       (2, 2, 7, '2024-02-01', NULL, 'Active', 1, NULL);

INSERT INTO subscriptionaddons (SubscriptionAddOnId, SubscriptionId, AddOnId, StartDate, EndDate, Status) VALUES
    (1, 1, 4, '2024-01-01', NULL, 'Active');

INSERT INTO planaddons (PlanId, AddOnId) VALUES
                                             (1, 1), (1, 5),
                                             (2, 1), (2, 5),
                                             (3, 1), (3, 2), (3, 4),
                                             (4, 1), (4, 2), (4, 4),
                                             (5, 1), (5, 2), (5, 3), (5, 4), (5, 5),
                                             (6, 6), (6, 10),
                                             (7, 6), (7, 9),
                                             (8, 6), (8, 7), (8, 9),
                                             (9, 7), (9, 8), (9, 9);

INSERT INTO planfeatures (FeatureId, PlanId, FeatureName, FeatureValue, Unit, SortOrder) VALUES
                                                                                             (1, 3, 'Perk', '$5/mo off device financing for 12 months', NULL, 10),
                                                                                             (2, 3, 'Perk', 'Free spam call blocking', NULL, 11),
                                                                                             (3, 4, 'Perk', 'Free 3-month streaming bundle', NULL, 10),
                                                                                             (4, 4, 'Perk', 'Hotspot included (10GB)', NULL, 11),
                                                                                             (5, 4, 'Perk', 'Free SIM activation', NULL, 12),
                                                                                             (6, 5, 'Perk', 'Canada + US roaming included', NULL, 10),
                                                                                             (7, 5, 'Perk', 'Priority support line', NULL, 11),
                                                                                             (8, 5, 'Perk', 'Free device protection for 2 months', NULL, 12),
                                                                                             (9, 6, 'Perk', 'Free install (online orders)', NULL, 10),
                                                                                             (10, 6, 'Perk', 'Free modem rental included', NULL, 11),
                                                                                             (11, 8, 'Perk', 'Streaming-ready (4K on multiple devices)', NULL, 10),
                                                                                             (12, 8, 'Perk', 'Free Wi-Fi extender for 3 months', NULL, 11),
                                                                                             (13, 8, 'Perk', 'Free speed upgrade for 1 month', NULL, 12),
                                                                                             (14, 9, 'Perk', 'Mesh Wi-Fi discount (50% off first month)', NULL, 10),
                                                                                             (15, 9, 'Perk', 'Priority support + faster dispatch', NULL, 11),
                                                                                             (16, 9, 'Perk', 'Free install + equipment setup', NULL, 12);

INSERT INTO paymentaccounts (AccountId, CustomerId, balance, CreatedAt, cardNumber, cvv, expiredDate, holderName, method, expiryMonth, expiryYear, last4, stripePaymentMethodId) VALUES
    (1, 3, NULL, NULL, '4242424242424242', NULL, '2026-07-01', 'Sarah Chen', 'VISA', NULL, NULL, NULL, NULL);



INSERT INTO payments (PaymentId, CustomerId, PaymentDate, amount, Method, Status) VALUES
    (1, 3, '2026-01-17 15:17:57', 63.00, 'Credit Card', 'Completed');

INSERT INTO servicerequests (RequestId, CustomerId, CreatedByUserId, AssignedTechnicianUserId, ParentRequestId, RequestType, Priority, Status, Description, CreatedAt, UpdatedAt) VALUES
    (1, 1, 4, 3, NULL, 'Installation', 'Medium', 'Assigned', 'Need help setting up mobile service', '2026-01-17 15:17:57', NULL);

INSERT INTO serviceappointments (AppointmentId, RequestId, TechnicianUserId, AddressId, LocationId, LocationType, ScheduledStart, ScheduledEnd, Status, Notes) VALUES
    (1, 1, 3, 2, NULL, 'OnSite', '2024-03-10 10:00:00', '2024-03-10 11:00:00', 'Scheduled', NULL);