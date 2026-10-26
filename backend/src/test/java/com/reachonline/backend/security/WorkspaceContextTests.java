package com.reachonline.backend.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WorkspaceContextTests {

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void regularUserGetsPersonalOwnerFromVerifiedSubject() {
        authenticate("user_123", "user");

        assertEquals(
                "user_123",
                WorkspaceContext.ownerFor(WorkspaceContext.Workspace.PERSONAL)
        );
    }

    @Test
    void adminCanSelectPersonalWorkspaceForOwnRecords() {
        authenticate("admin_123", "admin");

        assertEquals(
                WorkspaceContext.Workspace.PERSONAL,
                WorkspaceContext.currentWorkspace("personal")
        );
    }

    @Test
    void missingRoleDoesNotGrantAdminManagement() {
        authenticate("user_123", null);

        assertThrows(
                ResponseStatusException.class,
                () -> WorkspaceContext.requireManagement(
                        WorkspaceContext.Workspace.DEMO
                )
        );
    }

    @Test
    void publicMetadataRoleCanGrantAdminManagementFromVerifiedJwt() {
        authenticateWithClaims(
                "admin_123",
                Map.of("public_metadata", Map.of("role", "admin"))
        );

        WorkspaceContext.requireManagement(WorkspaceContext.Workspace.DEMO);
    }

    @Test
    void unknownRoleDoesNotGrantAdminManagement() {
        authenticateWithClaims(
                "user_123",
                Map.of("role", "owner")
        );

        assertThrows(
                ResponseStatusException.class,
                () -> WorkspaceContext.requireManagement(
                        WorkspaceContext.Workspace.DEMO
                )
        );
    }

    private void authenticate(String subject, String role) {
        Map<String, Object> claims = role == null
                ? Map.of("sub", subject)
                : Map.of("sub", subject, "role", role);

        authenticateWithClaims(subject, claims);
    }

    private void authenticateWithClaims(String subject, Map<String, Object> additionalClaims) {
        Map<String, Object> claims = new java.util.HashMap<>(additionalClaims);
        claims.put("sub", subject);
        Jwt jwt = new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(300),
                Map.of("alg", "RS256"),
                claims
        );

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(jwt, jwt, java.util.List.of())
        );
    }
}
