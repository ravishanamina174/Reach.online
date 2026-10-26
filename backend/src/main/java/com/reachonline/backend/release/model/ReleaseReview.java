package com.reachonline.backend.release.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "release_reviews")
public class ReleaseReview {

    @Id
    private UUID id;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "baseline_version", length = 80)
    private String baselineVersion;

    @Column(name = "proposed_version", nullable = false, length = 80)
    private String proposedVersion;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String findings;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected ReleaseReview() {
    }

    public ReleaseReview(
            UUID contractId,
            String baselineVersion,
            String proposedVersion,
            String status,
            String findings
    ) {
        this.contractId = contractId;
        this.baselineVersion = baselineVersion;
        this.proposedVersion = proposedVersion;
        this.status = status;
        this.findings = findings;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // Keep updated entity lifecycle handling here if needed.
    }

    public void complete(String status, String findings) {
        this.status = status;
        this.findings = findings;
        this.completedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getContractId() {
        return contractId;
    }

    public String getBaselineVersion() {
        return baselineVersion;
    }

    public String getProposedVersion() {
        return proposedVersion;
    }

    public String getStatus() {
        return status;
    }

    public String getFindings() {
        return findings;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}