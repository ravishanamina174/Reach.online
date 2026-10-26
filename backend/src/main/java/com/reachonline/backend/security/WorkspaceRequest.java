package com.reachonline.backend.security;

import jakarta.servlet.http.HttpServletRequest;

public final class WorkspaceRequest {

    private WorkspaceRequest() {}

    public static WorkspaceContext.Workspace from(HttpServletRequest request) {
        return WorkspaceContext.currentWorkspace(
                request.getHeader("X-Reach-Workspace")
        );
    }
}
