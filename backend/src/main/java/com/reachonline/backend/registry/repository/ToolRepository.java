package com.reachonline.backend.registry.repository;

import com.reachonline.backend.registry.model.Tool;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ToolRepository extends JpaRepository<Tool, UUID> {
    boolean existsByNameIgnoreCase(String name);
}