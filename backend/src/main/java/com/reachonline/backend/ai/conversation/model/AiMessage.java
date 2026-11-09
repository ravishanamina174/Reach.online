
package com.reachonline.backend.ai.conversation.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_messages")
public class AiMessage {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected AiMessage() {}

    public AiMessage(
            AiConversation conversation,
            String role,
            String content
    ) {
        this.id = UUID.randomUUID();
        this.conversation = conversation;
        this.role = role;
        this.content = content;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public AiConversation getConversation() {
        return conversation;
    }

    public String getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
