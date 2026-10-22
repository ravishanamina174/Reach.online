
package com.reachonline.backend.contracts.controller;

import java.util.List;

import tools.jackson.databind.JsonNode;

public record ContractDiffResponse(
        String contractName,
        String fromVersion,
        String toVersion,
        boolean hasChanges,
        List<Change> changes
) {
    public record Change(
            String path,
            ChangeType type,
            JsonNode before,
            JsonNode after
    ) {
    }

    public enum ChangeType {
        ADDED,
        REMOVED,
        CHANGED
    }
}
