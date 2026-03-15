INSERT INTO servicetypes (ServiceTypeId, Name, Description) VALUES
(1, 'Mobile', 'Mobile phone services'),
(2, 'Internet', 'Home internet services');

INSERT INTO locations (LocationId, LocationName, LocationType, Street1, Street2, City, Province, PostalCode, Country, Phone, IsActive) VALUES
(1, 'Downtown Sales Office', 'SalesPoint', NULL, NULL, 'Calgary', 'AB', NULL, 'Canada', '403-555-1000', 1),
(2, 'North Warehouse', 'Warehouse', NULL, NULL, 'Calgary', 'AB', NULL, 'Canada', '403-555-2000', 1),
(3, 'Head Office', 'Office', NULL, NULL, 'Calgary', 'AB', NULL, 'Canada', '403-555-3000', 1);

INSERT INTO customers (CustomerId, CustomerType, FirstName, LastName, BusinessName, Email, HomePhone, Status, CreatedAt, PasswordHash, ExternalCustomerId, ExternalProvider) VALUES
(1, 'Individual', 'John', 'Doe', NULL, 'john.doe@email.com', '403-444-4444', 'Active', '2026-01-17 15:17:57', '', NULL, NULL),
(2, 'Business', NULL, NULL, NULL, 'info@acmeinc.com', '403-555-5555', 'Active', '2026-01-17 15:17:57', '', NULL, NULL),

INSERT INTO employees (EmployeeId, PrimaryLocationId, ReportsToEmployeeId, FirstName, LastName, Email, Phone, PositionTitle, Salary, HireDate, Status, Active, ManagerId) VALUES
(1, 3, NULL, 'Alice', 'Managers', 'webdeveloper1030@hotmail.com', '403-111-1111', 'Manager', 85000.00, '2022-01-15', 'Active', 1, NULL),
(2, 1, NULL, 'Bob', 'Agent', 'yujou.huang@edu.sait.ca', '403-222-2222', 'Sales Agent', 55000.00, '2023-03-01', 'Active', 1, NULL),
(3, 1, NULL, 'Charlie', 'Tech', 'linda101488@hotmail.com', '403-333-3333', 'Service Technician', 60000.00, '2023-06-10', 'Active', 1, NULL),


INSERT INTO useraccounts (UserId, CustomerId, EmployeeId, Username, PasswordHash, Role, IsLocked, LastLoginAt, AvatarUrl) VALUES
(1, 8, 1, 'alice.manager', 'Password123', 'Manager', 0, '2026-03-12 21:52:01', NULL),
(2, NULL, 2, 'bob.agent', 'Password123', 'SalesAgent', 0, '2026-03-12 19:46:35', NULL),
(3, NULL, 3, 'charlie.tech', 'Password123', 'ServiceTechnician', 0, '2026-03-04 20:30:43', NULL),
(4, 1, NULL, 'john.customer', 'Password123', 'Customer', 0, NULL, NULL),

INSERT INTO customeraddresses (AddressId, CustomerId, AddressType, Street1, Street2, City, Province, PostalCode, Country, IsPrimary) VALUES
(1, 1, 'Billing', '123 Main St', NULL, 'Calgary', 'AB', 'T2P 1A1', 'Canada', 1),
(2, 1, 'Service', '123 Main St', NULL, 'Calgary', 'AB', 'T2P 1A1', 'Canada', 1),
(3, 2, 'Billing', '456 Industrial Rd', NULL, 'Calgary', 'AB', 'T3A 2B2', 'Canada', 1),

INSERT INTO addons (AddOnId, ServiceTypeId, AddOnName, MonthlyPrice, Description, IsActive, IconKey, ThemeKey) VALUES
(1, 1, 'International Calling', 10, NULL, 1, NULL, NULL),
(2, 2, 'Wi-Fi Extender', 5, 'Tryout', 1, NULL, NULL),
(3, NULL, 'Music Pass', 5, 'Unlimited music streaming', 1, NULL, NULL),
(4, NULL, 'Video Pass', 8, 'Unlimited video streaming', 1, NULL, NULL),
(5, NULL, 'Family Share', 12, 'Share plan with family members', 1, NULL, NULL),
(6, NULL, 'Rewards+', 3, 'Earn bonus reward points', 1, NULL, NULL),
(7, 1, 'Device Protection', 9, 'Covers accidental damage for phones', 1, NULL, NULL),
(8, 1, 'Extra 10GB Data', 12, 'Adds 10GB of data per month', 1, NULL, NULL),
(9, 1, 'Roaming Bundle', 15, 'Discounted roaming in US/Mexico', 1, NULL, NULL),
(10, 2, 'Wi-Fi Extender Plus', 6, 'Improves coverage in larger homes', 1, NULL, NULL),
(11, 2, 'Static IP', 8, 'Fixed IP for remote access / servers', 1, NULL, NULL),
(12, 2, 'Premium Support', 5, 'Priority troubleshooting + faster dispatch', 1, NULL, NULL);

INSERT INTO plans (PlanId, ServiceTypeId, PlanName, MonthlyPrice, ContractTermMonths, Description, IsActive, Tagline, Badge, IconKey, ThemeKey, DataLabel) VALUES
(1, 1, 'Unlimited Mobile 50', 50.00, 24, NULL, 1, NULL, NULL, NULL, NULL, NULL),
(2, 2, 'Fibre Internet 300', 75.00, 12, NULL, 1, NULL, NULL, NULL, NULL, NULL),
(3, 1, 'StartUp', 35.00, NULL, 'Perfect for starters', 1, NULL, NULL, NULL, NULL, NULL),
(4, 1, 'StreamMax', 55.00, NULL, 'For content lovers', 1, NULL, NULL, NULL, NULL, NULL),
(5, 1, 'PowerPlay', 75.00, NULL, 'Ultimate freedom', 1, NULL, NULL, NULL, NULL, NULL),
(6, 2, 'Home Basic', 60.00, NULL, 'Reliable home internet for everyday use', 1, NULL, NULL, NULL, NULL, NULL),
(7, 2, 'Home Plus', 80.00, NULL, 'Fast internet for streaming and work', 1, NULL, NULL, NULL, NULL, NULL),
(8, 2, 'Home Ultra', 100.00, NULL, 'Gigabit speed for power users', 1, NULL, NULL, NULL, NULL, NULL),
(9, 1, 'Starter Mobile 25', 25.00, 12, 'Basic mobile plan for light users', 1, NULL, NULL, NULL, NULL, NULL),
(10, 1, 'Plus Mobile 65', 65.00, 24, 'More data + perks for everyday use', 1, NULL, NULL, NULL, NULL, NULL),
(11, 1, 'Max Mobile 90', 90.00, 24, 'Premium mobile plan with best perks', 1, NULL, NULL, NULL, NULL, NULL),
(12, 2, 'Internet Basic 100', 55.00, 12, '100 Mbps home internet', 1, NULL, NULL, NULL, NULL, NULL),
(13, 2, 'Internet Plus 500', 85.00, 12, '500 Mbps for streaming + work', 1, NULL, NULL, NULL, NULL, NULL),
(14, 2, 'Internet Pro 1000', 110.00, 24, 'Gigabit internet for power users', 1, NULL, NULL, NULL, NULL, NULL);

INSERT INTO subscriptions (SubscriptionId, CustomerId, PlanId, StartDate, EndDate, Status, BillingCycleDay, Notes) VALUES
(1, 3, 1, '2024-01-01', NULL, 'Active', 1, NULL),
(2, 2, 2, '2024-02-01', NULL, 'Active', 1, NULL);

INSERT INTO subscriptionaddons (SubscriptionAddOnId, SubscriptionId, AddOnId, StartDate, EndDate, Status) VALUES
(1, 1, 1, '2024-01-01', NULL, 'Active');

INSERT INTO planaddons (PlanId, AddOnId) VALUES
(1,1),(2,1),(3,1),(2,2),(3,2),(1,3),(2,3),(3,3),(4,3),(5,3),(6,3),(1,4),(2,4),(3,4),(5,4),(6,4);

INSERT INTO planfeatures (FeatureId, PlanId, FeatureName, FeatureValue, Unit, SortOrder) VALUES
(1,1,'Data','Unlimited',NULL,0),
(2,1,'Calling','Unlimited Canada',NULL,0),
(3,2,'Speed','300','Mbps',0),
(4,1,'Perk','5G Speed',NULL,0),
(5,1,'Perk','Free Music Streaming',NULL,0),
(6,1,'Perk','Unlimited Texting',NULL,0),
(7,1,'Perk','100 Intl Minutes',NULL,0),
(8,2,'Perk','5G+ Speed',NULL,0),
(9,2,'Perk','Free Video Streaming',NULL,0),
(10,2,'Perk','Unlimited Everything',NULL,0),
(11,2,'Perk','Social Media Data Free',NULL,0),
(12,2,'Perk','Priority Support',NULL,0),
(13,3,'Perk','5G+ Ultra',NULL,0),
(14,3,'Perk','All Streaming Free',NULL,0),
(15,3,'Perk','Gaming Priority',NULL,0),
(16,3,'Perk','Free Device Insurance',NULL,0),
(17,3,'Perk','VIP Support',NULL,0),
(18,3,'Perk','Free Netflix',NULL,0),
(19,4,'Perk','Unlimited Data',NULL,0),
(20,4,'Perk','Wi-Fi Router Included',NULL,0),
(21,5,'Perk','Unlimited Data',NULL,0),
(22,5,'Perk','Wi-Fi 6 Router',NULL,0),
(23,5,'Perk','Streaming Optimized',NULL,0),
(24,6,'Perk','Unlimited Data',NULL,0),
(25,6,'Perk','Gigabit Speed',NULL,0),
(26,6,'Perk','Premium Router',NULL,0),
(27,6,'Perk','Priority Support',NULL,0);

INSERT INTO paymentaccounts (AccountId, CustomerId, balance, CreatedAt, cardNumber, cvv, expiredDate, holderName, method, expiryMonth, expiryYear, last4, stripePaymentMethodId) VALUES
(1, 3, NULL, NULL, '4499999999999999', NULL, '2026-07-01', 'Sarah Chen', 'VISA', NULL, NULL, NULL, NULL);

INSERT INTO invoices (InvoiceId, CustomerId, InvoiceNumber, IssueDate, DueDate, subtotal, taxTotal, total, PaidByAccountId, Status, promoCode) VALUES
(1, 1, 'INV-1001', '2024-03-01', '2024-03-15', 60, 3, 63, NULL, 'Open', NULL);

INSERT INTO invoiceitems (InvoiceItemId, InvoiceId, Description, Quantity, unitPrice, discountAmount, lineTotal) VALUES
(1, 1, 'Unlimited Mobile 50 Plan', 1, 50.00, NULL, 50.00),
(2, 1, 'International Calling Add-on', 1, 10.00, NULL, 10.00);

INSERT INTO payments (PaymentId, CustomerId, PaymentDate, amount, Method, Status) VALUES
(1, 3, '2026-01-17 15:17:57', 63.00, 'Credit Card', 'Completed');

INSERT INTO paymentallocations (PaymentAllocationId, PaymentId, InvoiceId, AmountApplied) VALUES
(1, 1, 1, 63.00);

INSERT INTO servicerequests (RequestId, CustomerId, CreatedByUserId, AssignedTechnicianUserId, ParentRequestId, RequestType, Priority, Status, Description, CreatedAt, UpdatedAt) VALUES
(1, 1, 4, 3, NULL, 'Installation', 'Medium', 'Assigned', 'Need help setting up mobile service', '2026-01-17 15:17:57', NULL);

INSERT INTO serviceappointments (AppointmentId, RequestId, TechnicianUserId, AddressId, LocationId, LocationType, ScheduledStart, ScheduledEnd, Status, Notes) VALUES
(1, 1, 3, 2, NULL, 'OnSite', '2024-03-10 10:00:00', '2024-03-10 11:00:00', 'Scheduled', NULL);