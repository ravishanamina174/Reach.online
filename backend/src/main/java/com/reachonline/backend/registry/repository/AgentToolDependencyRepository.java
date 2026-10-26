
package com.reachonline.backend.registry.repository;

import com.reachonline.backend.registry.model.AgentToolDependency;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AgentToolDependencyRepository
        extends JpaRepository<AgentToolDependency, UUID> {

    @EntityGraph(attributePaths = {"agent", "tool"})
    @Override
    List<AgentToolDependency> findAll();

    @Query("""
        SELECT dependency
        FROM AgentToolDependency dependency
        JOIN FETCH dependency.agent
        JOIN FETCH dependency.tool
        WHERE LOWER(dependency.tool.name) = LOWER(:toolName)
        ORDER BY dependency.agent.name ASC
        """)
    List<AgentToolDependency> findByToolNameWithAgent(
            @Param("toolName") String toolName
    );

    @Query("""
        SELECT dependency
        FROM AgentToolDependency dependency
        JOIN FETCH dependency.agent
        JOIN FETCH dependency.tool
        WHERE dependency.ownerUserId = :ownerUserId
           OR (:ownerUserId = '__DEMO__' AND dependency.ownerUserId IS NULL)
        ORDER BY dependency.agent.name ASC
        """)
    List<AgentToolDependency> findAllByOwnerUserIdWithAgentsAndTools(
            @Param("ownerUserId") String ownerUserId
    );

    @Query("""
        SELECT dependency
        FROM AgentToolDependency dependency
        JOIN FETCH dependency.agent
        JOIN FETCH dependency.tool
        WHERE LOWER(dependency.tool.name) = LOWER(:toolName)
          AND (dependency.ownerUserId = :ownerUserId
           OR (:ownerUserId = '__DEMO__' AND dependency.ownerUserId IS NULL))
        ORDER BY dependency.agent.name ASC
        """)
    List<AgentToolDependency> findByToolNameWithAgentAndOwner(
            @Param("toolName") String toolName,
            @Param("ownerUserId") String ownerUserId
    );
}
