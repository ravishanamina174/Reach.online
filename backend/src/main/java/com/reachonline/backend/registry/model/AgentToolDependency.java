
package com.reachonline.backend.registry.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "agent_tool_dependencies",
    uniqueConstraints = {}
)
public class AgentToolDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_user_id", length = 255)
    private String ownerUserId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agent_id", nullable = false)
    private Agent agent;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tool_id", nullable = false)
    private Tool tool;

    @Column(name = "consumer_expectations", nullable = false, columnDefinition = "TEXT")
    private String consumerExpectations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AgentToolDependency() {
    }

    public AgentToolDependency(
            Agent agent,
            Tool tool,
            String consumerExpectations
    ) {
        this.agent = agent;
        this.tool = tool;
        this.consumerExpectations = consumerExpectations;
    }

    public AgentToolDependency(
            Agent agent,
            Tool tool,
            String consumerExpectations,
            String ownerUserId
    ) {
        this(agent, tool, consumerExpectations);
        this.ownerUserId = ownerUserId;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public Agent getAgent() {
        return agent;
    }

    public Tool getTool() {
        return tool;
    }

    public String getConsumerExpectations() {
        return consumerExpectations;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
