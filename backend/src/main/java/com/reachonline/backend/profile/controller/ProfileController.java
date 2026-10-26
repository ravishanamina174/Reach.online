package com.reachonline.backend.profile.controller;

import com.reachonline.backend.profile.ProfileService;
import com.reachonline.backend.security.WorkspaceContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ProfileResponse getOwnProfile() {
        String userId = WorkspaceContext.userIdOrThrow();
        return profileService.getOrCreate(userId, defaultDisplayName());
    }

    @PatchMapping("/me")
    public ProfileResponse updateOwnProfile(
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return profileService.update(
                WorkspaceContext.userIdOrThrow(),
                request
        );
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOwnProfile() {
        profileService.delete(WorkspaceContext.userIdOrThrow());
    }

    @GetMapping("/public")
    public List<PublicProfileResponse> getPublicProfiles() {
        WorkspaceContext.userIdOrThrow();
        return profileService.findPublic();
    }

    @GetMapping("/public/{userId}")
    public PublicProfileResponse getPublicProfile(@PathVariable String userId) {
        WorkspaceContext.userIdOrThrow();
        return profileService.findPublic(userId);
    }

    private String defaultDisplayName() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            Map<String, Object> claims = jwt.getClaims();
            Object name = claims.get("name");
            if (name instanceof String value && !value.isBlank()) {
                return value;
            }
        }
        return WorkspaceContext.userIdOrThrow();
    }
}
