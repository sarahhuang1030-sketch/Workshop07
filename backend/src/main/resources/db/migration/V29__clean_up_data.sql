DELETE FROM `telecom_system1`.`useraccounts` WHERE (`UserId` = '5');
DELETE FROM `telecom_system1`.`useraccounts` WHERE (`UserId` = '6');
DELETE FROM `telecom_system1`.`useraccounts` WHERE (`UserId` = '7');
DELETE FROM `telecom_system1`.`useraccounts` WHERE (`UserId` = '8');
DELETE FROM `telecom_system1`.`useraccounts` WHERE (`UserId` = '9');
DELETE FROM `telecom_system1`.`useraccounts` WHERE (`UserId` = '10');


DELETE FROM `telecom_system1`.`employees` WHERE (`EmployeeId` = '4');
DELETE FROM `telecom_system1`.`employees` WHERE (`EmployeeId` = '5');
DELETE FROM `telecom_system1`.`employees` WHERE (`EmployeeId` = '6');
DELETE FROM `telecom_system1`.`employees` WHERE (`EmployeeId` = '7');
DELETE FROM `telecom_system1`.`employees` WHERE (`EmployeeId` = '8');
DELETE FROM `telecom_system1`.`employees` WHERE (`EmployeeId` = '9');


DELETE FROM invoiceitems
WHERE InvoiceId IN (
    SELECT InvoiceId FROM invoices WHERE CustomerId IN (2,3,4,5,6)
);
-- invoices referencing customers
DELETE FROM invoices WHERE CustomerId IN (2,3,4,5,6);

-- ✅ FIRST: delete child table
DELETE FROM subscriptionaddons
WHERE SubscriptionId IN (
    SELECT SubscriptionId FROM subscriptions WHERE CustomerId IN (2,3,4,5,6)
);

-- ⚠️ NEW: subscriptions (THIS is your current crash)
DELETE FROM subscriptions WHERE CustomerId IN (2,3,4,5,6);

-- (optional but safe if exists)
DELETE FROM subscriptionaddons
WHERE SubscriptionId IN (
    SELECT SubscriptionId FROM subscriptions WHERE CustomerId IN (2,3,4,5,6)
);

-- ✅ FIX: remove payment accounts first
DELETE FROM paymentaccounts WHERE CustomerId IN (2,3,4,5,6);
-- ✅ NEW FIX (THIS is your current crash)
DELETE FROM payments WHERE CustomerId IN (2,3,4,5,6);

DELETE FROM customeraddresses WHERE CustomerId IN (2,3,4,5,6);
DELETE FROM `telecom_system1`.`customers` WHERE (`CustomerId` = '2');
DELETE FROM `telecom_system1`.`customers` WHERE (`CustomerId` = '3');
DELETE FROM `telecom_system1`.`customers` WHERE (`CustomerId` = '4');
DELETE FROM `telecom_system1`.`customers` WHERE (`CustomerId` = '5');
DELETE FROM `telecom_system1`.`customers` WHERE (`CustomerId` = '6');

UPDATE `telecom_system1`.`customers` SET `AssignedEmployeeId` = '2' WHERE (`CustomerId` = '1');


UPDATE `telecom_system1`.`plans` SET `ContractTermMonths` = '48' WHERE (`PlanId` = '10');
UPDATE `telecom_system1`.`plans` SET `ContractTermMonths` = '30' WHERE (`PlanId` = '11');
UPDATE `telecom_system1`.`plans` SET `ContractTermMonths` = '36' WHERE (`PlanId` = '12');
UPDATE `telecom_system1`.`plans` SET `ContractTermMonths` = '30' WHERE (`PlanId` = '13');
