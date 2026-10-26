
package com.reachonline.backend.contracts.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "contracts",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_contract_name_version",
        columnNames = {"name", "version"}
    )
)
public class Contract {

    @Id
    private UUID id;

    @Column(name = "owner_user_id", length = 255)
    private String ownerUserId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "contract_type", nullable = false, length = 30)
    private String contractType;

    @Column(nullable = false, length = 80)
    private String version;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Contract() {
    }

    public Contract(
        String name,
        String contractType,
        String version,
        String content
    ) {
        this.name = name;
        this.contractType = contractType;
        this.version = version;
        this.content = content;
    }

    public Contract(
        String name,
        String contractType,
        String version,
        String content,
        String ownerUserId
    ) {
        this(name, contractType, version, content);
        this.ownerUserId = ownerUserId;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public String getName() {
        return name;
    }

    public String getContractType() {
        return contractType;
    }

    public String getVersion() {
        return version;
    }

    public String getContent() {
        return content;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
