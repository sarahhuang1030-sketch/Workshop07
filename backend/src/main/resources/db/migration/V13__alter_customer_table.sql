ALTER TABLE customers
    ADD COLUMN AssignedEmployeeId INT NULL,
ADD CONSTRAINT FK_Customers_AssignedEmployee
FOREIGN KEY (AssignedEmployeeId) REFERENCES employees(EmployeeId);
