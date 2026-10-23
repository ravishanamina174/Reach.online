package com.reachonline.backend.governance.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "governance_policies",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_governance_policy_name",
            columnNames = "name"
        )
    }
)
public class GovernancePolicy {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 160)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "rule_type", nullable = false, length = 80)
    private String ruleType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String configuration;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected GovernancePolicy() {
    }

    public GovernancePolicy(
            String name,
            String description,
            String ruleType,
            String configuration,
            boolean enabled
    ) {
        this.name = name;
        this.description = description;
        this.ruleType = ruleType;
        this.configuration = configuration;
        this.enabled = enabled;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        Instant now = Instant.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getRuleType() {
        return ruleType;
    }

    public String getConfiguration() {
        return configuration;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}