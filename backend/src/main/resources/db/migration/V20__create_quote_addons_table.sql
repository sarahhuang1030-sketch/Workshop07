-- =========================================================
-- V20: Create join table between Quote and AddOns
-- =========================================================

CREATE TABLE quote_addons (
                              id INT NOT NULL AUTO_INCREMENT,

                              quote_id INT NOT NULL,
                              addon_id INT NOT NULL,

                              PRIMARY KEY (id),

                              INDEX idx_quote_addons_quote_id (quote_id),
                              INDEX idx_quote_addons_addon_id (addon_id),

                              CONSTRAINT fk_quote_addons_quote
                                  FOREIGN KEY (quote_id)
                                      REFERENCES quotes(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_quote_addons_addon
                                  FOREIGN KEY (addon_id)
                                      REFERENCES AddOns(AddOnId)
                                      ON DELETE RESTRICT
);

-- =========================================================
-- fix quotes table
-- =========================================================

ALTER TABLE quotes ADD COLUMN plan_id INT;