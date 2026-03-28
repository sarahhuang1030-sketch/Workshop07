ALTER TABLE useraccounts
    ADD COLUMN MustChangePassword TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE useraccounts
    ADD COLUMN TempPasswordExpiresAt DATETIME NULL;

ALTER TABLE useraccounts
    ADD COLUMN PasswordChangedAt DATETIME NULL;

ALTER TABLE useraccounts
    ADD COLUMN IsActive TINYINT(1) NOT NULL DEFAULT 1;