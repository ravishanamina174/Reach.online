package com.reachonline.backend.profile;

import com.reachonline.backend.profile.controller.PublicProfileResponse;
import com.reachonline.backend.profile.controller.ProfileResponse;
import com.reachonline.backend.profile.controller.UpdateProfileRequest;
import com.reachonline.backend.profile.model.Profile;
import com.reachonline.backend.profile.repository.ProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository repository;

    public ProfileService(ProfileRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ProfileResponse getOrCreate(String userId, String defaultDisplayName) {
        Profile profile = repository.findById(userId).orElseGet(() -> repository.save(
                new Profile(userId, normalizeDisplayName(defaultDisplayName, userId), null, null, false)
        ));
        return ProfileResponse.from(profile);
    }

    @Transactional
    public ProfileResponse update(
            String userId,
            UpdateProfileRequest request
    ) {
        Profile profile = repository.findById(userId).orElseGet(() -> new Profile(
                userId,
                normalizeDisplayName(request.displayName(), userId),
                null,
                null,
                false
        ));

        profile.update(
                normalizeDisplayName(request.displayName(), userId),
                normalizeOptional(request.bio()),
                normalizeOptional(request.website()),
                request.publicProfile()
        );
        return ProfileResponse.from(repository.save(profile));
    }

    @Transactional
    public void delete(String userId) {
        repository.deleteById(userId);
    }

    @Transactional(readOnly = true)
    public List<PublicProfileResponse> findPublic() {
        return repository.findAllByPublicProfileTrueOrderByDisplayNameAsc()
                .stream()
                .map(PublicProfileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse findPublic(String userId) {
        Profile profile = repository.findById(userId)
                .filter(Profile::isPublicProfile)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Public profile was not found."
                ));
        return PublicProfileResponse.from(profile);
    }

    private String normalizeDisplayName(String value, String userId) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isBlank() ? userId : normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
