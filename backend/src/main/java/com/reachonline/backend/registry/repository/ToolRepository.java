
package com.reachonline.backend.registry.repository;

import com.reachonline.backend.registry.model.Tool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ToolRepository extends JpaRepository<Tool, UUID> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Tool> findByNameIgnoreCase(String name);

    @Query("SELECT t FROM Tool t WHERE t.ownerUserId = :owner OR (:owner = '__DEMO__' AND t.ownerUserId IS NULL)")
    List<Tool> findAllByOwnerUserId(@Param("owner") String ownerUserId);
    @Query("SELECT COUNT(t) > 0 FROM Tool t WHERE LOWER(t.name) = LOWER(:name) AND (t.ownerUserId = :owner OR (:owner = '__DEMO__' AND t.ownerUserId IS NULL))")
    boolean existsByNameIgnoreCaseAndOwnerUserId(@Param("name") String name, @Param("owner") String ownerUserId);
    @Query("SELECT t FROM Tool t WHERE LOWER(t.name) = LOWER(:name) AND (t.ownerUserId = :owner OR (:owner = '__DEMO__' AND t.ownerUserId IS NULL))")
    Optional<Tool> findByNameIgnoreCaseAndOwnerUserId(@Param("name") String name, @Param("owner") String ownerUserId);
}
