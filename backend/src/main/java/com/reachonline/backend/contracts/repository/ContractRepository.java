
package com.reachonline.backend.contracts.repository;

import com.reachonline.backend.contracts.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findAllByOrderByNameAscVersionAsc();

    List<Contract> findByNameOrderByCreatedAtDesc(String name);

    Optional<Contract> findByNameAndVersion(String name, String version);

    boolean existsByNameAndVersion(String name, String version);
}
