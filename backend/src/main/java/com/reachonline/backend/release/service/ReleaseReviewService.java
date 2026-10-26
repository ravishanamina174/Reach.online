package com.reachonline.backend.release.service;

import com.reachonline.backend.contracts.ContractImpactService;
import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import com.reachonline.backend.contracts.model.Contract;
import com.reachonline.backend.contracts.repository.ContractRepository;
import com.reachonline.backend.governance.controller.GovernanceEvaluationResponse;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;
import com.reachonline.backend.release.controller.CreateReleaseReviewRequest;
import com.reachonline.backend.release.controller.ReleaseReviewResponse;
import com.reachonline.backend.release.model.ReleaseReview;
import com.reachonline.backend.release.repository.ReleaseReviewRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

@Service
public class ReleaseReviewService {

    private final ContractRepository contractRepository;
    private final ContractImpactService contractImpactService;
    private final GovernanceEvaluationService governanceEvaluationService;
    private final ReleaseReviewRepository releaseReviewRepository;
    private final JsonMapper jsonMapper;

    public ReleaseReviewService(
            ContractRepository contractRepository,
            ContractImpactService contractImpactService,
            GovernanceEvaluationService governanceEvaluationService,
            ReleaseReviewRepository releaseReviewRepository,
            JsonMapper jsonMapper
    ) {
        this.contractRepository = contractRepository;
        this.contractImpactService = contractImpactService;
        this.governanceEvaluationService = governanceEvaluationService;
        this.releaseReviewRepository = releaseReviewRepository;
        this.jsonMapper = jsonMapper;
    }

    @Transactional
    public ReleaseReviewResponse createReview(
            CreateReleaseReviewRequest request,
            String ownerUserId
    ) {
        if (request.fromVersion().equals(request.proposedVersion())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Source and proposed versions must be different."
            );
        }

        Contract proposedContract = contractRepository
                .findByNameAndVersionAndOwnerUserId(
                        request.contractName(),
                        request.proposedVersion(),
                        ownerUserId
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Proposed contract version was not found."
                ));

        // Reuse Phase 2.3: calculate contract differences and dependencies.
        ContractImpactResponse impact =
                contractImpactService.analyze(
                        request.contractName(),
                        request.fromVersion(),
                        request.proposedVersion(),
                        ownerUserId
                );

        // Reuse Phase 2.4: evaluate enabled governance policies.
        GovernanceEvaluationResponse governance =
                governanceEvaluationService.evaluate(impact, ownerUserId);

        String findingsJson = serializeFindings(impact, governance);

        ReleaseReview review = new ReleaseReview(
                proposedContract.getId(),
                request.fromVersion(),
                request.proposedVersion(),
                governance.decision(),
                findingsJson,
                ownerUserId
        );

        // Mark the review as completed and persist the result.
        review.complete(governance.decision(), findingsJson);

        ReleaseReview saved = releaseReviewRepository.save(review);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReleaseReviewResponse> getAllReviews(String ownerUserId) {
        return releaseReviewRepository
                .findAllByOwnerUserIdOrderByCreatedAtDesc(ownerUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReleaseReviewResponse getReview(UUID id, String ownerUserId) {
        ReleaseReview review = releaseReviewRepository.findAllByOwnerUserIdOrderByCreatedAtDesc(ownerUserId)
                .stream()
                .filter(candidate -> candidate.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Release review was not found."
                ));

        return toResponse(review);
    }

    private String serializeFindings(
            ContractImpactResponse impact,
            GovernanceEvaluationResponse governance
    ) {
        try {
            List<String> recommendations = new ArrayList<>();

            if ("BLOCKED".equals(governance.decision())) {
                recommendations.add(
                        "Resolve all blocking governance findings before release."
                );
            } else if ("WARNING".equals(governance.decision())) {
                recommendations.add(
                        "Review the warning findings and confirm consumer compatibility before release."
                );
            } else {
                recommendations.add(
                        "No enabled governance policy blocked this release."
                );
            }

            if (impact.affectedAgentCount() > 0) {
                recommendations.add(
                        "Validate the changed contract paths with every affected agent consumer."
                );
            }

            if (!impact.hasChanges()) {
                recommendations.add(
                        "The selected versions are equivalent; no contract migration is required."
                );
            }

            return jsonMapper.writeValueAsString(
                    Map.of(
                            "impact", impact,
                            "governance", governance,
                            "recommendations", recommendations
                    )
            );
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not serialize the release review findings."
            );
        }
    }

    private ReleaseReviewResponse toResponse(ReleaseReview review) {
        try {
            JsonNode findings = jsonMapper.readTree(review.getFindings());

            return new ReleaseReviewResponse(
                    review.getId(),
                    review.getContractId(),
                    review.getContractId() == null
                            ? null
                            : contractRepository.findById(review.getContractId())
                                    .map(Contract::getName)
                                    .orElse(null),
                    review.getBaselineVersion(),
                    review.getProposedVersion(),
                    review.getStatus(),
                    findings,
                    review.getCreatedAt(),
                    review.getCompletedAt()
            );
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not read the stored release review findings."
            );
        }
    }
}