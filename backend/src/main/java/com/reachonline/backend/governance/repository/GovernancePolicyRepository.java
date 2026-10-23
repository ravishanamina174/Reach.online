package com.reachonline.backend.governance.repository;

import com.reachonline.backend.governance.model.GovernancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GovernancePolicyRepository
        extends JpaRepository<GovernancePolicy, UUID> {

    boolean existsByNameIgnoreCase(String name);

    List<GovernancePolicy> findAllByOrderByCreatedAtDesc();
}