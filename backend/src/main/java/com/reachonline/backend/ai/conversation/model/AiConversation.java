
package com.reachonline.backend.ai.conversation.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_conversations")
public class AiConversation {

    @Id
    private UUID id;

    @Column(name = "owner_user_id", nullable = false, length = 255)
    private String ownerUserId;

    @Column(nullable = false, length = 20)
    private String workspace;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected AiConversation() {}

    public AiConversation(String ownerUserId, String workspace) {
        this.id = UUID.randomUUID();
        this.ownerUserId = ownerUserId;
        this.workspace = workspace;
        this.title = "New chat";
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    public void setTitleFromFirstMessage(String message) {
        if (!"New chat".equals(title)) {
            return;
        }

        String normalized = message.trim().replaceAll("\\s+", " ");

        if (normalized.length() > 90) {
            normalized = normalized.substring(0, 87) + "...";
        }

        title = normalized;
        touch();
    }

    public void rename(String newTitle) {
        title = newTitle.trim();
        touch();
    }

    public void touch() {
        updatedAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public String getWorkspace() {
        return workspace;
    }

    public String getTitle() {
        return title;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
