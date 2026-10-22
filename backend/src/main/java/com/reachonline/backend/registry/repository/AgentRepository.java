package com.reachonline.backend.registry.repository;

import com.reachonline.backend.registry.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AgentRepository extends JpaRepository<Agent, UUID> {
    boolean existsByNameIgnoreCase(String name);
}