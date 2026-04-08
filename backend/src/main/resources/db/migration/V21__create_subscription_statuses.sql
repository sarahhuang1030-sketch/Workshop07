-- =========================================================
-- V21__create_subscription_statuses.sql
-- Lookup table for subscription status values
-- =========================================================

CREATE TABLE subscriptionstatuses (
                                      StatusId INT NOT NULL AUTO_INCREMENT,
                                      StatusCode VARCHAR(30) NOT NULL,
                                      DisplayName VARCHAR(50) NOT NULL,
                                      IsActive TINYINT(1) NOT NULL DEFAULT 1,
                                      SortOrder INT NOT NULL DEFAULT 0,
                                      PRIMARY KEY (StatusId),
                                      CONSTRAINT uq_subscriptionstatuses_code UNIQUE (StatusCode),
                                      CONSTRAINT uq_subscriptionstatuses_display UNIQUE (DisplayName)
);

INSERT INTO subscriptionstatuses (StatusCode, DisplayName, IsActive, SortOrder)
VALUES
    ('ACTIVE', 'Active', 1, 1),
    ('PENDING', 'Pending', 1, 2),
    ('SUSPENDED', 'Suspended', 1, 3),
    ('CANCELLED', 'Cancelled', 1, 4);