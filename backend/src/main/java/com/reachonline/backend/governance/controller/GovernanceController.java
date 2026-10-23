package com.reachonline.backend.governance.controller;

import com.reachonline.backend.governance.model.GovernancePolicy;
import com.reachonline.backend.governance.repository.GovernancePolicyRepository;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/governance")
public class GovernanceController {

    private static final List<String> SUPPORTED_RULES = List.of(
            "BLOCK_ON_ANY_REMOVAL",
            "BLOCK_REMOVED_PROTECTED_PATH",
            "WARN_ON_ANY_CHANGE"
    );

    private final GovernancePolicyRepository policyRepository;
    private final GovernanceEvaluationService evaluationService;
    private final JsonMapper jsonMapper;

    public GovernanceController(
            GovernancePolicyRepository policyRepository,
            GovernanceEvaluationService evaluationService,
            JsonMapper jsonMapper
    ) {
        this.policyRepository = policyRepository;
        this.evaluationService = evaluationService;
        this.jsonMapper = jsonMapper;
    }

    @GetMapping("/policies")
    public List<GovernancePolicy> getPolicies() {
        return policyRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/policies")
    @ResponseStatus(HttpStatus.CREATED)
    public GovernancePolicy createPolicy(
            @Valid @RequestBody CreateGovernancePolicyRequest request
    ) {
        String ruleType = request.ruleType()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!SUPPORTED_RULES.contains(ruleType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported ruleType. Supported types: "
                            + String.join(", ", SUPPORTED_RULES)
            );
        }

        if (policyRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A governance policy with this name already exists."
            );
        }

        validateConfiguration(ruleType, request.configuration());

        GovernancePolicy policy = new GovernancePolicy(
                request.name().trim(),
                request.description(),
                ruleType,
                request.configuration(),
                request.enabled()
        );

        return policyRepository.save(policy);
    }

    @PatchMapping("/policies/{id}/enabled")
    public GovernancePolicy setPolicyEnabled(
            @PathVariable UUID id,
            @RequestParam boolean enabled
    ) {
        GovernancePolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Governance policy not found."
                ));

        policy.setEnabled(enabled);

        return policyRepository.save(policy);
    }

    @PostMapping("/evaluate")
    public GovernanceEvaluationResponse evaluate(
            @Valid @RequestBody GovernanceEvaluationRequest request
    ) {
        return evaluationService.evaluate(request.impact());
    }

    private void validateConfiguration(
            String ruleType,
            String configuration
    ) {
        JsonNode config;

        try {
            config = jsonMapper.readTree(configuration);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "configuration must contain valid JSON."
            );
        }

        if (config == null || !config.isObject()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "configuration must be a JSON object."
            );
        }

        if ("BLOCK_REMOVED_PROTECTED_PATH".equals(ruleType)) {
            JsonNode paths = config.get("paths");

            if (paths == null || !paths.isArray() || paths.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "BLOCK_REMOVED_PROTECTED_PATH requires a non-empty "
                                + "configuration.paths array."
                );
            }

            for (JsonNode path : paths) {
                if (!path.isString()
                        || path.asString() == null
                        || path.asString().isBlank()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Every configuration.paths entry must be "
                                    + "a non-empty string."
                    );
                }
            }
        }
    }
}