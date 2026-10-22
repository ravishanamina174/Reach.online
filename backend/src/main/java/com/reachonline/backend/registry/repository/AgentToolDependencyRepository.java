
package com.reachonline.backend.registry.repository;

import com.reachonline.backend.registry.model.AgentToolDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AgentToolDependencyRepository
        extends JpaRepository<AgentToolDependency, UUID> {

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
}
