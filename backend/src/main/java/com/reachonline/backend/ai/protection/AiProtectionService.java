package com.reachonline.backend.ai.protection;

import com.reachonline.backend.ai.service.ReachAiAssistant;
import com.reachonline.backend.ai.service.ReachPlatformTools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.model.output.TokenUsage;
import dev.langchain4j.service.SystemMessage;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Service
public class AiProtectionService {

        private static final String ACTIVE = "ACTIVE";
        private static final Logger LOGGER = LoggerFactory.getLogger(
                        AiProtectionService.class
        );

    private final JdbcTemplate jdbcTemplate;
    private final AiProtectionProperties properties;
        private final TransactionTemplate requiresNewTransaction;
        private final ScheduledExecutorService scheduler;

    public AiProtectionService(
            JdbcTemplate jdbcTemplate,
            AiProtectionProperties properties,
            PlatformTransactionManager transactionManager,
            ScheduledExecutorService scheduler
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
        this.requiresNewTransaction = new TransactionTemplate(transactionManager);
        this.requiresNewTransaction.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
        this.scheduler = scheduler;
    }

    @Transactional
    public AiGenerationReservation reserve(
            String userId,
            String ipAddress,
            String prompt
    ) {
        LocalDate usageDate = LocalDate.now(ZoneOffset.UTC);
        Instant bucketStart = Instant.now()
                .truncatedTo(ChronoUnit.MINUTES);

        recoverAbandonedReservations();

        Integer ipRequestCount = requiresNewTransaction.execute(status ->
                recordIpAttempt(bucketStart, ipAddress)
        );

        if (ipRequestCount == null
                || ipRequestCount > properties.getIpRequestsPerMinute()) {
            throw tooManyRequests(
                    "The IP address has exceeded the AI request limit of "
                            + properties.getIpRequestsPerMinute()
                            + " requests per minute."
            );
        }

        ensureUsageRows(usageDate, userId);

        Map<String, Object> userUsage = jdbcTemplate.queryForMap(
                """
                SELECT request_count, active_generations
                FROM ai_user_daily_usage
                WHERE usage_date = ? AND user_id = ?
                FOR UPDATE
                """,
                usageDate,
                userId
        );

        if (number(userUsage, "request_count")
                >= properties.getDailyUserRequestLimit()) {
            throw tooManyRequests(
                    "The daily AI message limit of "
                            + properties.getDailyUserRequestLimit()
                            + " messages has been reached."
            );
        }

        if (number(userUsage, "active_generations")
                >= properties.getMaxActiveGenerationsPerUser()) {
            throw tooManyRequests(
                    "You already have an AI response in progress."
            );
        }

        Map<String, Object> globalUsage = jdbcTemplate.queryForMap(
                """
                SELECT request_count, reserved_tokens, consumed_tokens,
                       active_generations
                FROM ai_global_daily_usage
                WHERE usage_date = ?
                FOR UPDATE
                """,
                usageDate
        );

        if (number(globalUsage, "request_count")
                >= properties.getGlobalRequestLimit()) {
            throw tooManyRequests(
                    "The global daily AI request limit has been reached."
            );
        }

        if (number(globalUsage, "active_generations")
                >= properties.getMaxActiveGenerations()) {
            throw tooManyRequests(
                    "The application is currently handling the maximum number of AI responses."
            );
        }

        long reservedTokens = reservationTokens(prompt);
        long tokenUsage = number(globalUsage, "reserved_tokens")
                + number(globalUsage, "consumed_tokens");

        if (tokenUsage + reservedTokens > properties.getGlobalTokenLimit()) {
            throw tooManyRequests(
                    "The global daily AI token budget has been reached."
            );
        }

        UUID reservationId = UUID.randomUUID();

        jdbcTemplate.update(
                """
                UPDATE ai_user_daily_usage
                SET request_count = request_count + 1,
                    active_generations = active_generations + 1
                WHERE usage_date = ? AND user_id = ?
                """,
                usageDate,
                userId
        );

        jdbcTemplate.update(
                """
                UPDATE ai_global_daily_usage
                SET request_count = request_count + 1,
                    reserved_tokens = reserved_tokens + ?,
                    active_generations = active_generations + 1
                WHERE usage_date = ?
                """,
                reservedTokens,
                usageDate
        );

        jdbcTemplate.update(
                """
                INSERT INTO ai_generation_reservations
                    (id, usage_date, user_id, reserved_tokens, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                reservationId,
                usageDate,
                userId,
                reservedTokens,
                ACTIVE
        );

        return new AiGenerationReservation(reservationId, reservedTokens);
    }

    public ScheduledFuture<?> startHeartbeat(
            AiGenerationReservation reservation
    ) {
        return startHeartbeat(reservation, new AtomicBoolean());
    }

    public ScheduledFuture<?> startHeartbeat(
            AiGenerationReservation reservation,
            AtomicBoolean heartbeatFailed
    ) {
        long intervalSeconds = Math.max(
                1,
                properties.getReservationTimeoutSeconds() / 3
        );

        return scheduler.scheduleAtFixedRate(
                () -> {
                    try {
                        heartbeat(reservation);
                    } catch (RuntimeException exception) {
                        heartbeatFailed.set(true);
                        LOGGER.warn(
                                "AI reservation heartbeat failed for {}",
                                reservation.id(),
                                exception
                        );
                    }
                },
                0,
                intervalSeconds,
                TimeUnit.SECONDS
        );
    }

    @Transactional
    public void heartbeat(AiGenerationReservation reservation) {
        int updated = jdbcTemplate.update(
                """
                UPDATE ai_generation_reservations
                SET last_heartbeat_at = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 'ACTIVE'
                """,
                reservation.id()
        );

            if (updated != 1) {
                throw new IllegalStateException(
                    "Expected one ACTIVE AI reservation heartbeat update, but updated "
                        + updated
                        + " rows."
                );
            }
    }

    @Transactional
    public void reconcile(
            AiGenerationReservation reservation,
                        boolean providerCompleted,
            TokenUsage tokenUsage
    ) {
                reconcile(reservation, providerCompleted, tokenUsage, false);
    }

    @Transactional
    public void reconcile(
            AiGenerationReservation reservation,
            boolean providerCompleted,
            TokenUsage tokenUsage,
            boolean definitiveFailure
    ) {
        Long actualTokens = tokenUsage != null
                ? actualTokens(tokenUsage)
                : null;
        String status = actualTokens != null
                ? "COMPLETED"
                : providerCompleted || !definitiveFailure
                        ? "UNKNOWN"
                        : "FAILED";

        int updated = jdbcTemplate.update(
                """
                UPDATE ai_generation_reservations
                SET status = ?
                WHERE id = ? AND status = 'ACTIVE'
                """,
                status,
                reservation.id()
        );

        if (updated == 0) {
            return;
        }

        Map<String, Object> reservationData = jdbcTemplate.queryForMap(
                """
                SELECT usage_date, user_id, reserved_tokens
                FROM ai_generation_reservations
                WHERE id = ?
                """,
                reservation.id()
        );

        LocalDate usageDate = toLocalDate(reservationData.get("usage_date"));
        String userId = (String) reservationData.get("user_id");
        long reservedTokens = number(reservationData, "reserved_tokens");

        if (actualTokens != null) {
            if (actualTokens > reservedTokens) {
                LOGGER.warn(
                        "AI generation {} used {} tokens against a reservation of {}",
                        reservation.id(),
                        actualTokens,
                        reservedTokens
                );
            }

            jdbcTemplate.update(
                    """
                    UPDATE ai_global_daily_usage
                    SET reserved_tokens = GREATEST(reserved_tokens - ?, 0),
                        consumed_tokens = consumed_tokens + ?
                    WHERE usage_date = ?
                    """,
                    reservedTokens,
                    actualTokens,
                    usageDate
            );
        } else if (!providerCompleted && definitiveFailure) {
            jdbcTemplate.update(
                    """
                    UPDATE ai_global_daily_usage
                    SET reserved_tokens = GREATEST(reserved_tokens - ?, 0)
                    WHERE usage_date = ?
                    """,
                    reservedTokens,
                    usageDate
            );
        }

        jdbcTemplate.update(
                """
                UPDATE ai_global_daily_usage
                SET active_generations = GREATEST(active_generations - 1, 0)
                WHERE usage_date = ?
                """,
                usageDate
        );

        jdbcTemplate.update(
                """
                UPDATE ai_user_daily_usage
                SET active_generations = GREATEST(active_generations - 1, 0)
                WHERE usage_date = ? AND user_id = ?
                """,
                usageDate,
                userId
        );
    }

        private Integer recordIpAttempt(Instant bucketStart, String ipAddress) {
        List<Integer> rows = jdbcTemplate.query(
                """
                INSERT INTO ai_ip_rate_limits
                    (bucket_start, ip_address, request_count)
                VALUES (?, ?, 1)
                ON CONFLICT (bucket_start, ip_address)
                DO UPDATE SET request_count = ai_ip_rate_limits.request_count + 1
                RETURNING request_count
                """,
                statement -> {
                    statement.setTimestamp(1, Timestamp.from(bucketStart));
                    statement.setString(2, ipAddress);
                },
                (resultSet, rowNumber) -> resultSet.getInt(1)
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private void recoverAbandonedReservations() {
        requiresNewTransaction.executeWithoutResult(status -> {
            List<Map<String, Object>> abandoned = jdbcTemplate.queryForList(
                    """
                    WITH expired AS (
                        UPDATE ai_generation_reservations
                        SET status = 'ABANDONED'
                        WHERE status = 'ACTIVE'
                          AND last_heartbeat_at < CURRENT_TIMESTAMP
                              - (? * INTERVAL '1 second')
                        RETURNING usage_date, user_id, reserved_tokens
                    )
                    SELECT usage_date, user_id, reserved_tokens
                    FROM expired
                    """,
                    properties.getReservationTimeoutSeconds()
            );

            for (Map<String, Object> reservation : abandoned) {
                LocalDate usageDate = toLocalDate(
                        reservation.get("usage_date")
                );
                String userId = (String) reservation.get("user_id");
                long reservedTokens = number(reservation, "reserved_tokens");

                jdbcTemplate.update(
                        """
                        UPDATE ai_global_daily_usage
                        SET reserved_tokens = GREATEST(reserved_tokens - ?, 0),
                            active_generations = GREATEST(active_generations - 1, 0)
                        WHERE usage_date = ?
                        """,
                        reservedTokens,
                        usageDate
                );

                jdbcTemplate.update(
                        """
                        UPDATE ai_user_daily_usage
                        SET active_generations = GREATEST(active_generations - 1, 0)
                        WHERE usage_date = ? AND user_id = ?
                        """,
                        usageDate,
                        userId
                );
            }
        });
    }

    private void ensureUsageRows(LocalDate usageDate, String userId) {
        jdbcTemplate.update(
                """
                INSERT INTO ai_user_daily_usage (usage_date, user_id)
                VALUES (?, ?)
                ON CONFLICT (usage_date, user_id) DO NOTHING
                """,
                usageDate,
                userId
        );

        jdbcTemplate.update(
                """
                INSERT INTO ai_global_daily_usage (usage_date)
                VALUES (?)
                ON CONFLICT (usage_date) DO NOTHING
                """,
                usageDate
        );
    }

    private long reservationTokens(String prompt) {
        long estimatedInputTokens = estimateCompleteInputTokens(prompt);

        if (estimatedInputTokens > properties.getMaxInputTokens()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The AI prompt is too large for the configured input limit."
            );
        }

        long reservedTokens = Math.addExact(
                estimatedInputTokens,
                properties.getMaxOutputTokens()
        );

        if (reservedTokens > properties.getGlobalTokenLimit()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI token reservation settings exceed the global daily token budget."
            );
        }

        return reservedTokens;
    }

    private long estimateCompleteInputTokens(String prompt) {
        StringBuilder effectiveRequest = new StringBuilder(prompt);

        try {
            Method chatMethod = ReachAiAssistant.class.getMethod(
                    "chat",
                    String.class
            );
            SystemMessage systemMessage = chatMethod.getAnnotation(
                    SystemMessage.class
            );
            if (systemMessage != null) {
                append(effectiveRequest, String.join(
                        systemMessage.delimiter(),
                        systemMessage.value()
                ));
            }
        } catch (NoSuchMethodException exception) {
            throw new IllegalStateException(
                    "Reach AI assistant chat method is not available.",
                    exception
            );
        }

        for (var method : ReachPlatformTools.class.getDeclaredMethods()) {
            Tool tool = method.getAnnotation(Tool.class);
            if (tool == null) {
                continue;
            }

            append(effectiveRequest, method.getName());
            append(effectiveRequest, String.join(" ", tool.value()));

            for (var parameter : method.getParameters()) {
                append(effectiveRequest, parameter.getType().getSimpleName());
                P description = parameter.getAnnotation(P.class);
                if (description != null) {
                    append(effectiveRequest, description.name());
                    append(effectiveRequest, description.value());
                }
            }
        }

        long estimatedTextTokens = Math.max(
                1,
                (long) Math.ceil(effectiveRequest.length() / 4.0 * 1.25)
        );

        return Math.addExact(
                estimatedTextTokens,
                properties.getRequestStructureOverheadTokens()
        );
    }

    private void append(StringBuilder target, String value) {
        if (value != null && !value.isBlank()) {
            target.append('\n').append(value);
        }
    }

    private Long actualTokens(TokenUsage usage) {
        if (usage.totalTokenCount() != null) {
            return usage.totalTokenCount().longValue();
        }

        if (usage.inputTokenCount() != null
                && usage.outputTokenCount() != null) {
            return usage.inputTokenCount().longValue()
                    + usage.outputTokenCount().longValue();
        }

        return null;
    }

    private long number(Map<String, Object> values, String key) {
        return ((Number) values.get(key)).longValue();
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof java.sql.Date date) {
            return date.toLocalDate();
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        }
        throw new IllegalStateException(
                "Unsupported JDBC usage date type: "
                        + (value == null ? "null" : value.getClass().getName())
        );
        }

    private ResponseStatusException tooManyRequests(String message) {
        return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, message);
    }
}
