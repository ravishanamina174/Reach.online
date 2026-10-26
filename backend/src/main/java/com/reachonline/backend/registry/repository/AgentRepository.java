
package com.reachonline.backend.registry.repository;

import com.reachonline.backend.registry.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Agent> findByNameIgnoreCase(String name);

    @Query("SELECT a FROM Agent a WHERE a.ownerUserId = :owner OR (:owner = '__DEMO__' AND a.ownerUserId IS NULL)")
    List<Agent> findAllByOwnerUserId(@Param("owner") String ownerUserId);
    @Query("SELECT COUNT(a) > 0 FROM Agent a WHERE LOWER(a.name) = LOWER(:name) AND (a.ownerUserId = :owner OR (:owner = '__DEMO__' AND a.ownerUserId IS NULL))")
    boolean existsByNameIgnoreCaseAndOwnerUserId(@Param("name") String name, @Param("owner") String ownerUserId);
    @Query("SELECT a FROM Agent a WHERE LOWER(a.name) = LOWER(:name) AND (a.ownerUserId = :owner OR (:owner = '__DEMO__' AND a.ownerUserId IS NULL))")
    Optional<Agent> findByNameIgnoreCaseAndOwnerUserId(@Param("name") String name, @Param("owner") String ownerUserId);
}
