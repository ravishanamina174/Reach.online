package com.reachonline.backend.release.repository;

import com.reachonline.backend.release.model.ReleaseReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReleaseReviewRepository
        extends JpaRepository<ReleaseReview, UUID> {

    List<ReleaseReview> findAllByOrderByCreatedAtDesc();

    List<ReleaseReview> findAllByOwnerUserIdOrderByCreatedAtDesc(String ownerUserId);
}