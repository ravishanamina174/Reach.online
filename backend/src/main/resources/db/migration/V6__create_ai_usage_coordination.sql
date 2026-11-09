CREATE TABLE ai_user_daily_usage (
    usage_date DATE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    active_generations INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (usage_date, user_id)
);

CREATE TABLE ai_global_daily_usage (
    usage_date DATE PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 0,
    reserved_tokens BIGINT NOT NULL DEFAULT 0,
    consumed_tokens BIGINT NOT NULL DEFAULT 0,
    active_generations INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ai_ip_rate_limits (
    bucket_start TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, ip_address)
);

CREATE TABLE ai_generation_reservations (
    id UUID PRIMARY KEY,
    usage_date DATE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reserved_tokens BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ai_generation_reservation_status
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED', 'UNKNOWN'))
);

CREATE INDEX idx_ai_generation_reservations_created
    ON ai_generation_reservations(created_at);
