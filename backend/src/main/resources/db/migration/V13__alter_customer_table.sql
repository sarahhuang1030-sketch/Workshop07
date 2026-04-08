ALTER TABLE telecom_system1.customers
    ADD COLUMN AssignedEmployeeId INT NULL,
ADD CONSTRAINT FK_Customers_AssignedEmployee
FOREIGN KEY (AssignedEmployeeId) REFERENCES telecom_system1.employees(EmployeeId);
