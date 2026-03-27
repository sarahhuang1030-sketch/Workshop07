-- Create roles table
CREATE TABLE roles (
                       RoleId INT NOT NULL AUTO_INCREMENT,
                       RoleName VARCHAR(100) NOT NULL,
                       PRIMARY KEY (RoleId)
);

INSERT INTO roles (RoleName) VALUES
                                 ('Manager'),
                                 ('Sales Agent'),
                                 ('Service Technician'),
                                 ('Customer');

-- Add RoleId columns
ALTER TABLE employees ADD RoleId INT;
ALTER TABLE useraccounts ADD RoleId INT;

-- Map employees (safe)
UPDATE employees e
    JOIN roles r ON e.PositionTitle = r.RoleName
    SET e.RoleId = r.RoleId;

-- Map useraccounts (handles messy data)
UPDATE useraccounts
SET RoleId = CASE
                 WHEN LOWER(Role) = 'manager' THEN 1
                 WHEN LOWER(Role) = 'salesagent' THEN 2
                 WHEN LOWER(Role) = 'servicetechnician' THEN 3
                 WHEN LOWER(Role) = 'customer' THEN 4
                 ELSE 4 -- fallback to Customer instead of NULL (VERY IMPORTANT)
    END;

-- 🚨 SAFETY NET (CRITICAL for Flyway)
-- If anything still NULL, force to Customer
UPDATE employees SET RoleId = 4 WHERE RoleId IS NULL;
UPDATE useraccounts SET RoleId = 4 WHERE RoleId IS NULL;

-- Add constraints AFTER data is safe
ALTER TABLE roles
    ADD CONSTRAINT uq_roles_rolename UNIQUE (RoleName);

ALTER TABLE employees
    MODIFY RoleId INT NOT NULL,
    ADD CONSTRAINT fk_employees_role
    FOREIGN KEY (RoleId) REFERENCES roles(RoleId);

ALTER TABLE useraccounts
    MODIFY RoleId INT NOT NULL,
    ADD CONSTRAINT fk_useraccounts_role
    FOREIGN KEY (RoleId) REFERENCES roles(RoleId);

-- Drop old columns
ALTER TABLE employees DROP COLUMN PositionTitle;
ALTER TABLE useraccounts DROP COLUMN Role;

-- Insert new employees (optional)
INSERT INTO employees
(PrimaryLocationId, ReportsToEmployeeId, FirstName, LastName, Email, Phone, RoleId, Salary, HireDate, Status, Active, ManagerId)
VALUES
    (3, NULL, 'Miley', 'Simon', 'miley@example.ca', '403-222-3345', 1, 85000.00, '2023-01-15', 'Active', 1, NULL),
    (1, NULL, 'Europe', 'Perrot', 'europe@example.ca', '403-346-7890', 2, 59000.00, '2024-03-01', 'Active', 1, NULL),
    (1, NULL, 'Berezi', 'Huffmann', 'berezi@example.com', '403-666-3457', 3, 60000.00, '2023-06-10', 'Active', 1, NULL),
    (3, NULL, 'Morty', 'Jeffries', 'morty@example.com', '403-345-7532', 1, 95000.00, '2022-09-15', 'Active', 1, NULL),
    (1, NULL, 'Githa', 'Winfield', 'githa@example.ca', '403-444-3322', 2, 74000.00, '2023-10-02', 'Active', 1, NULL),
    (1, NULL, 'Patrick', 'Benson', 'patrick@example.com', '403-480-1235', 3, 100000.00, '2025-06-10', 'Active', 1, NULL);