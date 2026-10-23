package com.reachonline.backend.governance.controller;

import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record GovernanceEvaluationRequest(
        @NotNull @Valid ContractImpactResponse impact
) {
}