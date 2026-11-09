ALTER TABLE ai_generation_reservations
    ADD COLUMN last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX idx_ai_generation_reservations_active_heartbeat
    ON ai_generation_reservations(last_heartbeat_at)
    WHERE status = 'ACTIVE';
