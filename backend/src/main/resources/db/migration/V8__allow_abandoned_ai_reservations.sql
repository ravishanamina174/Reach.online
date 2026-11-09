ALTER TABLE ai_generation_reservations
    DROP CONSTRAINT chk_ai_generation_reservation_status;

ALTER TABLE ai_generation_reservations
    ADD CONSTRAINT chk_ai_generation_reservation_status
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED', 'UNKNOWN', 'ABANDONED'));
