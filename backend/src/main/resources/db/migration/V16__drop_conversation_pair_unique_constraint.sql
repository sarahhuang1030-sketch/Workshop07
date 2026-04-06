-- =========================================================
-- V16__drop_conversation_pair_unique_constraint.sql
-- Allow multiple conversations between same user pair
-- =========================================================

-- ---------------------------------------------------------
-- 1) Check if unique index exists
-- ---------------------------------------------------------
SET @has_unique_index := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'conversations'
      AND INDEX_NAME = 'uq_conversation_pair_context'
);

-- ---------------------------------------------------------
-- 2) Drop index only if it exists (safe migration)
-- ---------------------------------------------------------
SET @sql := IF(
    @has_unique_index > 0,
    'ALTER TABLE conversations DROP INDEX uq_conversation_pair_context',
    'SELECT ''uq_conversation_pair_context does not exist'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------
-- 3) Optional: Log confirmation
-- ---------------------------------------------------------
SELECT 'V16 migration applied: conversation pair uniqueness removed' AS status;