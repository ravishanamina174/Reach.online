
package com.reachonline.backend.contracts.controller;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.reachonline.backend.contracts.model.Contract;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ContractResponse(
    UUID id,
    String name,
    String contractType,
    String version,
    JsonNode content,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public static ContractResponse from(
        Contract contract,
        JsonMapper objectMapper
    ) {
        try {
            return new ContractResponse(
                contract.getId(),
                contract.getName(),
                contract.getContractType(),
                contract.getVersion(),
                objectMapper.readTree(contract.getContent()),
                contract.getCreatedAt(),
                contract.getUpdatedAt()
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Stored contract contains invalid JSON",
                exception
            );
        }
    }
}
