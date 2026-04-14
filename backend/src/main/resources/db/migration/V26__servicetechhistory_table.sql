CREATE TABLE IF NOT EXISTS `telecom_system1`.`technicianservicehistory` (
                                                                            `TechnicianHistoryId` INT NOT NULL AUTO_INCREMENT,
                                                                            `TechnicianWorkPlateNo` VARCHAR(15) NOT NULL,
    `TechnicianUserId` INT NOT NULL,
    `TechnicianVehicleColor` VARCHAR(20) NOT NULL,
    PRIMARY KEY (`TechnicianHistoryId`),
    UNIQUE KEY `TechnicianWorkPlateNo_UNIQUE` (`TechnicianWorkPlateNo`),
    UNIQUE KEY `TechnicianUserId_UNIQUE` (`TechnicianUserId`),
    CONSTRAINT `FK_TechnicianUserId`
    FOREIGN KEY (`TechnicianUserId`)
    REFERENCES `telecom_system1`.`employees` (`EmployeeId`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT);

INSERT INTO technicianservicehistory(TechnicianHistoryId, TechnicianWorkPlateNo, TechnicianUserId, TechnicianVehicleColor)
VALUES
    (1, "BYY-54A", 3, "Beige")
--     (2, "AXR-747", 11, "Green"),
--     (3, "32RA-ER", 14, "Merlot")

