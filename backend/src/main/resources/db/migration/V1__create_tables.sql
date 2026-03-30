CREATE TABLE servicetypes (
    ServiceTypeId INT NOT NULL AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL,
    Description VARCHAR(255),
    PRIMARY KEY (ServiceTypeId)
);

CREATE TABLE locations (
    LocationId INT NOT NULL AUTO_INCREMENT,
    LocationName VARCHAR(100) NOT NULL,
    LocationType ENUM('SalesPoint','Warehouse','Office') NOT NULL,
    Street1 VARCHAR(100),
    Street2 VARCHAR(100),
    City VARCHAR(50),
    Province VARCHAR(50),
    PostalCode VARCHAR(20),
    Country VARCHAR(50),
    Phone VARCHAR(20),
    IsActive TINYINT(1) DEFAULT 1,
    PRIMARY KEY (LocationId)
);

CREATE TABLE customers (
    CustomerId INT NOT NULL AUTO_INCREMENT,
    CustomerType VARCHAR(255) NOT NULL,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    BusinessName VARCHAR(100),
    Email VARCHAR(100),
    HomePhone VARCHAR(20),
    Status VARCHAR(255),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PasswordHash VARCHAR(255),
    ExternalCustomerId VARCHAR(64),
    ExternalProvider VARCHAR(32),
    PRIMARY KEY (CustomerId),
    UNIQUE KEY uq_customers_external (ExternalProvider, ExternalCustomerId),
    UNIQUE KEY uq_customers_provider_email (ExternalProvider, Email)
);

CREATE TABLE employees (
    EmployeeId INT NOT NULL AUTO_INCREMENT,
    PrimaryLocationId INT DEFAULT NULL,
    ReportsToEmployeeId INT DEFAULT NULL,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    PositionTitle VARCHAR(50) NOT NULL,
    Salary DECIMAL(38,2),
    HireDate DATE NOT NULL,
    Status VARCHAR(255),
    Active INT DEFAULT NULL,
    ManagerId INT DEFAULT NULL,
    PRIMARY KEY (EmployeeId),
    UNIQUE KEY Email (Email),
    KEY fk_emp_location (PrimaryLocationId),
    KEY fk_emp_manager (ReportsToEmployeeId),
    KEY fk_employee_manager (ManagerId),
    CONSTRAINT fk_emp_location FOREIGN KEY (PrimaryLocationId) REFERENCES locations (LocationId),
    CONSTRAINT fk_emp_manager FOREIGN KEY (ReportsToEmployeeId) REFERENCES employees (EmployeeId),
    CONSTRAINT fk_employee_manager FOREIGN KEY (ManagerId) REFERENCES employees (EmployeeId)
);

CREATE TABLE useraccounts (
    UserId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT DEFAULT NULL,
    EmployeeId INT DEFAULT NULL,
    Username VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(255),
    Role VARCHAR(255) NOT NULL,
    IsLocked INT NOT NULL,
    LastLoginAt DATETIME DEFAULT NULL,
    AvatarUrl VARCHAR(512) DEFAULT NULL,
    stripe_customer_id VARCHAR(255) DEFAULT NULL,
PRIMARY KEY (UserId),
    UNIQUE KEY Username (Username),
    KEY CustomerId (CustomerId),
    KEY EmployeeId (EmployeeId),
    CONSTRAINT useraccounts_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId),
    CONSTRAINT useraccounts_ibfk_2 FOREIGN KEY (EmployeeId) REFERENCES employees (EmployeeId),
    CONSTRAINT chk_user_owner CHECK ((CustomerId IS NOT NULL) OR (EmployeeId IS NOT NULL))
);

CREATE TABLE customeraddresses (
    AddressId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT NOT NULL,
    AddressType VARCHAR(255) NOT NULL,
    Street1 VARCHAR(100),
    Street2 VARCHAR(100),
    City VARCHAR(50),
    Province VARCHAR(50),
    PostalCode VARCHAR(20),
    Country VARCHAR(50),
    IsPrimary INT NOT NULL,
    PRIMARY KEY (AddressId),
    KEY CustomerId (CustomerId),
    CONSTRAINT customeraddresses_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId)
);

CREATE TABLE addons (
                        AddOnId INT NOT NULL AUTO_INCREMENT,
                        ServiceTypeId INT DEFAULT NULL,
                        AddOnName VARCHAR(100) NOT NULL,
                        MonthlyPrice DOUBLE DEFAULT NULL,
                        Description VARCHAR(255) DEFAULT NULL,
                        IsActive TINYINT(1) DEFAULT 1,
                        IconKey VARCHAR(50) DEFAULT NULL,
                        ThemeKey VARCHAR(50) DEFAULT NULL,
                        PRIMARY KEY (AddOnId),
                        KEY ServiceTypeId (ServiceTypeId),
                        CONSTRAINT addons_ibfk_1 FOREIGN KEY (ServiceTypeId) REFERENCES servicetypes (ServiceTypeId)
);

CREATE TABLE plans (
                       PlanId INT NOT NULL AUTO_INCREMENT,
                       ServiceTypeId INT NOT NULL,
                       PlanName VARCHAR(100) NOT NULL,
                       MonthlyPrice DECIMAL(10,2) NOT NULL,
                       ContractTermMonths INT DEFAULT NULL,
                       Description VARCHAR(255) DEFAULT NULL,
                       IsActive TINYINT(1) DEFAULT 1,
                       Tagline VARCHAR(100) DEFAULT NULL,
                       Badge VARCHAR(50) DEFAULT NULL,
                       IconKey VARCHAR(50) DEFAULT NULL,
                       ThemeKey VARCHAR(50) DEFAULT NULL,
                       DataLabel VARCHAR(50) DEFAULT NULL,
                       PRIMARY KEY (PlanId),
                       KEY ServiceTypeId (ServiceTypeId),
                       CONSTRAINT plans_ibfk_1 FOREIGN KEY (ServiceTypeId) REFERENCES servicetypes (ServiceTypeId)
);

CREATE TABLE subscriptions (
    SubscriptionId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT NOT NULL,
    PlanId INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE DEFAULT NULL,
    Status VARCHAR(255) DEFAULT NULL,
    BillingCycleDay INT DEFAULT NULL,
    Notes VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (SubscriptionId),
    KEY CustomerId (CustomerId),
    KEY PlanId (PlanId),
    CONSTRAINT subscriptions_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId),
    CONSTRAINT subscriptions_ibfk_2 FOREIGN KEY (PlanId) REFERENCES plans (PlanId)
);

CREATE TABLE subscriptionaddons (
    SubscriptionAddOnId INT NOT NULL AUTO_INCREMENT,
    SubscriptionId INT NOT NULL,
    AddOnId INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE DEFAULT NULL,
    Status VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (SubscriptionAddOnId),
    KEY SubscriptionId (SubscriptionId),
    KEY AddOnId (AddOnId),
    CONSTRAINT subscriptionaddons_ibfk_1 FOREIGN KEY (SubscriptionId) REFERENCES subscriptions (SubscriptionId),
    CONSTRAINT subscriptionaddons_ibfk_2 FOREIGN KEY (AddOnId) REFERENCES addons (AddOnId)
);

CREATE TABLE planaddons (
    PlanId INT NOT NULL,
    AddOnId INT NOT NULL,
    PRIMARY KEY (PlanId, AddOnId),
    KEY AddOnId (AddOnId),
    CONSTRAINT planaddons_ibfk_1 FOREIGN KEY (PlanId) REFERENCES plans (PlanId),
    CONSTRAINT planaddons_ibfk_2 FOREIGN KEY (AddOnId) REFERENCES addons (AddOnId)
);

CREATE TABLE planfeatures (
                              FeatureId INT NOT NULL AUTO_INCREMENT,
                              PlanId INT NOT NULL,
                              FeatureName VARCHAR(100) NOT NULL,
                              FeatureValue VARCHAR(100) DEFAULT NULL,
                              Unit VARCHAR(20) DEFAULT NULL,
                              SortOrder INT DEFAULT 0,
                              PRIMARY KEY (FeatureId),
                              KEY PlanId (PlanId),
                              CONSTRAINT planfeatures_ibfk_1 FOREIGN KEY (PlanId) REFERENCES plans (PlanId)
);

CREATE TABLE paymentaccounts (
    AccountId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT NOT NULL,
    balance DOUBLE DEFAULT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    cardNumber VARCHAR(255) DEFAULT NULL,
    cvv VARCHAR(255) DEFAULT NULL,
    expiredDate DATE DEFAULT NULL,
    holderName VARCHAR(255) DEFAULT NULL,
    method VARCHAR(255) DEFAULT NULL,
    expiryMonth INT DEFAULT NULL,
    expiryYear INT DEFAULT NULL,
    last4 VARCHAR(255) DEFAULT NULL,
    stripePaymentMethodId VARCHAR(255) DEFAULT NULL,
    isDefault INT DEFAULT 0,
    PRIMARY KEY (AccountId),
    KEY CustomerId (CustomerId),
    CONSTRAINT paymentaccounts_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId)
);

CREATE TABLE invoices (
    InvoiceId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT NOT NULL,
    InvoiceNumber VARCHAR(50) NOT NULL,
    IssueDate DATE DEFAULT NULL,
    DueDate DATE DEFAULT NULL,
    subtotal DOUBLE DEFAULT NULL,
    taxTotal DOUBLE DEFAULT NULL,
    total DOUBLE DEFAULT NULL,
    PaidByAccountId INT DEFAULT NULL,
    Status VARCHAR(30) DEFAULT NULL,
    promoCode VARCHAR(50) DEFAULT NULL,
    StripePaymentIntentId VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (InvoiceId),
    UNIQUE KEY InvoiceNumber (InvoiceNumber),
    KEY CustomerId (CustomerId),
    KEY FK_Invoices_PaymentAccount (PaidByAccountId),
    CONSTRAINT invoices_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId),
    CONSTRAINT FK_Invoices_PaymentAccount FOREIGN KEY (PaidByAccountId) REFERENCES paymentaccounts (AccountId)
);

CREATE TABLE invoiceitems (
    InvoiceItemId INT NOT NULL AUTO_INCREMENT,
    InvoiceId INT NOT NULL,
    Description VARCHAR(255) DEFAULT NULL,
    Quantity INT DEFAULT 1,
    unitPrice DECIMAL(38,2) DEFAULT NULL,
    discountAmount DECIMAL(38,2) DEFAULT NULL,
    lineTotal DECIMAL(38,2) DEFAULT NULL,
    PRIMARY KEY (InvoiceItemId),
    KEY InvoiceId (InvoiceId),
    CONSTRAINT invoiceitems_ibfk_1 FOREIGN KEY (InvoiceId) REFERENCES invoices (InvoiceId)
);

CREATE TABLE payments (
    PaymentId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT NOT NULL,
    PaymentDate DATETIME DEFAULT NULL,
    amount DECIMAL(38,2) DEFAULT NULL,
    Method VARCHAR(50) DEFAULT NULL,
    Status VARCHAR(30) DEFAULT NULL,
    PRIMARY KEY (PaymentId),
    KEY CustomerId (CustomerId),
    CONSTRAINT payments_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId)
);

CREATE TABLE paymentallocations (
    PaymentAllocationId INT NOT NULL AUTO_INCREMENT,
    PaymentId INT NOT NULL,
    InvoiceId INT NOT NULL,
    AmountApplied DECIMAL(10,2) DEFAULT NULL,
    PRIMARY KEY (PaymentAllocationId),
    KEY PaymentId (PaymentId),
    KEY InvoiceId (InvoiceId),
    CONSTRAINT paymentallocations_ibfk_1 FOREIGN KEY (PaymentId) REFERENCES payments (PaymentId),
    CONSTRAINT paymentallocations_ibfk_2 FOREIGN KEY (InvoiceId) REFERENCES invoices (InvoiceId)
);

CREATE TABLE servicerequests (
    RequestId INT NOT NULL AUTO_INCREMENT,
    CustomerId INT NOT NULL,
    CreatedByUserId INT NOT NULL,
    AssignedTechnicianUserId INT DEFAULT NULL,
    ParentRequestId INT DEFAULT NULL,
    RequestType VARCHAR(50) DEFAULT NULL,
    Priority ENUM('Low','Medium','High') DEFAULT 'Medium',
    Status VARCHAR(30) DEFAULT NULL,
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT NULL,
    PRIMARY KEY (RequestId),
    KEY CustomerId (CustomerId),
    KEY CreatedByUserId (CreatedByUserId),
    KEY AssignedTechnicianUserId (AssignedTechnicianUserId),
    KEY ParentRequestId (ParentRequestId),
    CONSTRAINT servicerequests_ibfk_1 FOREIGN KEY (CustomerId) REFERENCES customers (CustomerId),
    CONSTRAINT servicerequests_ibfk_2 FOREIGN KEY (CreatedByUserId) REFERENCES useraccounts (UserId),
    CONSTRAINT servicerequests_ibfk_3 FOREIGN KEY (AssignedTechnicianUserId) REFERENCES useraccounts (UserId),
    CONSTRAINT servicerequests_ibfk_4 FOREIGN KEY (ParentRequestId) REFERENCES servicerequests (RequestId)
);

CREATE TABLE serviceappointments (
    AppointmentId INT NOT NULL AUTO_INCREMENT,
    RequestId INT NOT NULL,
    TechnicianUserId INT NOT NULL,
    AddressId INT DEFAULT NULL,
    LocationId INT DEFAULT NULL,
    LocationType ENUM('InStore','OnSite','Remote') NOT NULL,
    ScheduledStart DATETIME NOT NULL,
    ScheduledEnd DATETIME NOT NULL,
    Status VARCHAR(30) DEFAULT NULL,
    Notes TEXT,
    PRIMARY KEY (AppointmentId),
    KEY RequestId (RequestId),
    KEY TechnicianUserId (TechnicianUserId),
    KEY AddressId (AddressId),
    KEY LocationId (LocationId),
    CONSTRAINT serviceappointments_ibfk_1 FOREIGN KEY (RequestId) REFERENCES servicerequests (RequestId),
    CONSTRAINT serviceappointments_ibfk_2 FOREIGN KEY (TechnicianUserId) REFERENCES useraccounts (UserId),
    CONSTRAINT serviceappointments_ibfk_3 FOREIGN KEY (AddressId) REFERENCES customeraddresses (AddressId),
    CONSTRAINT serviceappointments_ibfk_4 FOREIGN KEY (LocationId) REFERENCES locations (LocationId)
);

CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    module VARCHAR(50) DEFAULT NULL,
    action VARCHAR(50) DEFAULT NULL,
    target VARCHAR(255) DEFAULT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    doneBy VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE password_reset_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY user_id (user_id),
    KEY token_hash (token_hash)
);
