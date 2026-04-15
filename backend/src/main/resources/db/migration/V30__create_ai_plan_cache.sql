CREATE TABLE ai_plan_cache (
                               cache_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               cache_key VARCHAR(500) NOT NULL,
                               response_json LONGTEXT NOT NULL,
                               recommendation_mode VARCHAR(50),
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               expires_at TIMESTAMP NULL,
                               CONSTRAINT uq_ai_plan_cache_key UNIQUE (cache_key)
);

CREATE INDEX idx_ai_plan_cache_expires_at
    ON ai_plan_cache (expires_at);