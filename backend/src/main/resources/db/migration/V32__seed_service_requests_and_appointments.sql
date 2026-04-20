-- =============================================================================
-- V32__seed_service_requests_and_appointments.sql
-- Seed one service request per status and matching appointments.
-- Cleans up any existing test data first to ensure RequestId starts from 1.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Remove existing test data (respect foreign key order)
-- -----------------------------------------------------------------------------

-- Remove all appointments that reference service requests we are about to delete
DELETE FROM serviceappointments WHERE RequestId IN (
    SELECT RequestId FROM servicerequests
);

-- Remove self-referencing parent links before deleting requests
UPDATE servicerequests SET ParentRequestId = NULL;

-- Delete all existing service requests
DELETE FROM servicerequests;

-- Reset auto-increment so RequestId starts at 1
ALTER TABLE servicerequests AUTO_INCREMENT = 1;
ALTER TABLE serviceappointments AUTO_INCREMENT = 1;

-- -----------------------------------------------------------------------------
-- Step 2: Insert one service request per status
-- CustomerId=1 (John Doe), CreatedByUserId=1, TechnicianUserId=3 (Charlie Tech)
-- -----------------------------------------------------------------------------

-- RequestId = 1: Open (no technician assigned yet)
INSERT INTO servicerequests
(CustomerId, CreatedByUserId, AssignedTechnicianUserId, RequestType, Priority, Status, Description, CreatedAt)
VALUES
    (1, 1, NULL, 'Installation', 'High', 'Open', 'New fiber installation needed', NOW());

-- RequestId = 2: Assigned
INSERT INTO servicerequests
(CustomerId, CreatedByUserId, AssignedTechnicianUserId, RequestType, Priority, Status, Description, CreatedAt)
VALUES
    (1, 1, 3, 'Repair', 'Medium', 'Assigned', 'Router not working properly', NOW());

-- RequestId = 3: In Progress
INSERT INTO servicerequests
(CustomerId, CreatedByUserId, AssignedTechnicianUserId, RequestType, Priority, Status, Description, CreatedAt)
VALUES
    (1, 1, 3, 'Technical Support', 'Low', 'In Progress', 'Internet keeps dropping', NOW());

-- RequestId = 4: Completed
INSERT INTO servicerequests
(CustomerId, CreatedByUserId, AssignedTechnicianUserId, RequestType, Priority, Status, Description, CreatedAt)
VALUES
    (1, 1, 3, 'Upgrade', 'Medium', 'Completed', 'Upgraded to 1Gbps plan', NOW());

-- RequestId = 5: Cancelled
INSERT INTO servicerequests
(CustomerId, CreatedByUserId, AssignedTechnicianUserId, RequestType, Priority, Status, Description, CreatedAt)
VALUES
    (1, 1, 3, 'Billing Inquiry', 'Low', 'Cancelled', 'Customer cancelled request', NOW());

-- -----------------------------------------------------------------------------
-- Step 3: Insert appointments for Assigned, In Progress, and Completed requests
-- -----------------------------------------------------------------------------

-- AppointmentId = 1: for Request 2 (Assigned)
INSERT INTO serviceappointments
(RequestId, TechnicianUserId, AddressId, LocationType, ScheduledStart, ScheduledEnd, Status)
VALUES
    (2, 3, 1, 'OnSite', '2026-04-25 09:00:00', '2026-04-25 10:00:00', 'Scheduled');

-- AppointmentId = 2: for Request 3 (In Progress)
INSERT INTO serviceappointments
(RequestId, TechnicianUserId, AddressId, LocationType, ScheduledStart, ScheduledEnd, Status)
VALUES
    (3, 3, 1, 'OnSite', '2026-04-24 14:00:00', '2026-04-24 15:00:00', 'In Progress');

-- AppointmentId = 3: for Request 4 (Completed)
-- When the technician marks this appointment Completed,
-- syncRequestStatusFromAppointments() will also set Request 4 to Completed.
INSERT INTO serviceappointments
(RequestId, TechnicianUserId, AddressId, LocationType, ScheduledStart, ScheduledEnd, Status)
VALUES
    (4, 3, 1, 'OnSite', '2026-04-20 10:00:00', '2026-04-20 11:00:00', 'Completed');