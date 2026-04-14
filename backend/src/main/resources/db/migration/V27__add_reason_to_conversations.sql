-- =========================================================
-- V27__add_reason_to_conversations.sql
-- Add Reason column to conversations
-- =========================================================

-- Check if column already exists
SET @has_reason := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'conversations'
      AND COLUMN_NAME = 'Reason'
);

SET @sql := IF(
    @has_reason = 0,
    'ALTER TABLE conversations ADD COLUMN Reason VARCHAR(255) NULL AFTER Status',
    'SELECT ''conversations.Reason already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
