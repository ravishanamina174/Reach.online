
package com.reachonline.backend.contracts.controller;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateContractRequest(

    @NotBlank(message = "Contract name is required")
    @Size(max = 160, message = "Contract name must not exceed 160 characters")
    String name,

    @NotBlank(message = "Contract type is required")
    @Pattern(
        regexp = "OPENAPI|MCP_TOOL",
        message = "Contract type must be OPENAPI or MCP_TOOL"
    )
    String contractType,

    @NotBlank(message = "Contract version is required")
    @Size(max = 80, message = "Version must not exceed 80 characters")
    @Pattern(
        regexp = "[A-Za-z0-9][A-Za-z0-9._+-]*",
        message = "Version contains invalid characters"
    )
    String version,

    @NotNull(message = "Contract content is required")
    JsonNode content

) {
}
