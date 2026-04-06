-- =========================================================
-- V14__chat_requests_and_conversation_status.sql
-- Safe chat schema alignment
-- =========================================================

-- ---------------------------------------------------------
-- 1) Add Status to conversations only if missing
-- ---------------------------------------------------------
SET @has_conversation_status := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'conversations'
      AND COLUMN_NAME = 'Status'
);

SET @sql := IF(
    @has_conversation_status = 0,
    'ALTER TABLE conversations ADD COLUMN Status VARCHAR(20) NOT NULL DEFAULT ''ACTIVE''',
    'SELECT ''conversations.Status already exists'' '
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------
-- 2) Create chatrequests only if missing
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS chatrequests (
    RequestId INT NOT NULL AUTO_INCREMENT,
    CustomerUserId INT NOT NULL,
    AssignedEmployeeUserId INT DEFAULT NULL,
    ConversationId INT DEFAULT NULL,
    Reason VARCHAR(255) DEFAULT NULL,
    Comment TEXT,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    RequestedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    AcceptedAt DATETIME(6) DEFAULT NULL,
    ClosedAt DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (RequestId),
    KEY idx_chatrequests_status (Status),
    KEY idx_chatrequests_customer (CustomerUserId),
    KEY idx_chatrequests_employee (AssignedEmployeeUserId),
    KEY idx_chatrequests_requestedat (RequestedAt),
    KEY fk_chatrequests_conversation (ConversationId),
    CONSTRAINT fk_chatrequests_conversation
        FOREIGN KEY (ConversationId) REFERENCES conversations (ConversationId),
    CONSTRAINT fk_chatrequests_customer_user
        FOREIGN KEY (CustomerUserId) REFERENCES useraccounts (UserId),
    CONSTRAINT fk_chatrequests_employee_user
        FOREIGN KEY (AssignedEmployeeUserId) REFERENCES useraccounts (UserId)
);