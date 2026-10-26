package com.reachonline.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

public final class WorkspaceContext {

    public enum Workspace {
        DEMO,
        PERSONAL
    }

    private WorkspaceContext() {}

    public static Workspace currentWorkspace(String requested) {
        Workspace workspace = requested == null || requested.isBlank()
                ? Workspace.DEMO
                : parseWorkspace(requested);

        if (workspace == Workspace.PERSONAL && userId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Sign in is required for a personal workspace."
            );
        }

        return workspace;
    }

    public static String ownerFor(Workspace workspace) {
        return workspace == Workspace.DEMO ? "__DEMO__" : userIdOrThrow();
    }

    public static boolean isAdmin() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return false;
        }

        Object role = jwt.getClaim("role");
        if (role == null) {
            role = roleFromClaim(jwt, "public_metadata");
        }
        if (role == null) {
            role = roleFromClaim(jwt, "metadata");
        }

        return role instanceof String value && "admin".equalsIgnoreCase(value);
    }

    private static Object roleFromClaim(Jwt jwt, String claimName) {
        Map<String, Object> metadata = jwt.getClaimAsMap(claimName);
        return metadata == null ? null : metadata.get("role");
    }

    public static void requireManagement(Workspace workspace) {
        if (workspace == Workspace.DEMO && userId() != null && !isAdmin()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can change demo workspace data."
            );
        }
    }

    public static String userId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }

        return jwt.getSubject();
    }

    public static String userIdOrThrow() {
        String id = userId();
        if (id == null || id.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "A valid Clerk session is required."
            );
        }
        return id;
    }

    private static Workspace parseWorkspace(String value) {
        try {
            return Workspace.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Workspace must be DEMO or PERSONAL."
            );
        }
    }
}
