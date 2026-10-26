package com.reachonline.backend.release.controller;

import com.reachonline.backend.release.service.ReleaseReviewService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;
import com.reachonline.backend.security.WorkspaceContext;
import com.reachonline.backend.security.WorkspaceRequest;

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
            @Valid @RequestBody CreateReleaseReviewRequest request,
            HttpServletRequest httpRequest
    ) {
        WorkspaceContext.Workspace workspace = WorkspaceRequest.from(httpRequest);
        return releaseReviewService.createReview(
                request,
                WorkspaceContext.ownerFor(workspace)
        );
    }

    @GetMapping
    public List<ReleaseReviewResponse> getAllReviews(HttpServletRequest request) {
        return releaseReviewService.getAllReviews(
                WorkspaceContext.ownerFor(WorkspaceRequest.from(request))
        );
    }

    @GetMapping("/{id}")
    public ReleaseReviewResponse getReview(
            @PathVariable UUID id,
            HttpServletRequest request
    ) {
        return releaseReviewService.getReview(
                id, WorkspaceContext.ownerFor(WorkspaceRequest.from(request))
        );
    }
}