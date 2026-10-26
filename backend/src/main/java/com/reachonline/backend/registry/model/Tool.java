package com.reachonline.backend.registry.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tools")
public class Tool {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_user_id", length = 255)
    private String ownerUserId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 30)
    private String protocol;

    @Column(length = 1000)
    private String endpoint;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Tool() {}

    public Tool(
            String name,
            String description,
            String protocol,
            String endpoint
    ) {
        this.name = name;
        this.description = description;
        this.protocol = protocol;
        this.endpoint = endpoint;
        this.status = "ACTIVE";
    }

    public Tool(
            String name,
            String description,
            String protocol,
            String endpoint,
            String ownerUserId
    ) {
        this(name, description, protocol, endpoint);
        this.ownerUserId = ownerUserId;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getOwnerUserId() { return ownerUserId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getProtocol() { return protocol; }
    public String getEndpoint() { return endpoint; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) {
        this.description = description;
    }
    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public void setStatus(String status) { this.status = status; }
}