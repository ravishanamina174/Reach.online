package com.reachonline.backend.release.controller;

import com.reachonline.backend.release.service.ReleaseReviewService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/release-reviews")
public class ReleaseReviewController {

    private final ReleaseReviewService releaseReviewService;

    public ReleaseReviewController(
            ReleaseReviewService releaseReviewService
    ) {
        this.releaseReviewService = releaseReviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReleaseReviewResponse createReview(
            @Valid @RequestBody CreateReleaseReviewRequest request
    ) {
        return releaseReviewService.createReview(request);
    }

    @GetMapping
    public List<ReleaseReviewResponse> getAllReviews() {
        return releaseReviewService.getAllReviews();
    }

    @GetMapping("/{id}")
    public ReleaseReviewResponse getReview(@PathVariable UUID id) {
        return releaseReviewService.getReview(id);
    }
}