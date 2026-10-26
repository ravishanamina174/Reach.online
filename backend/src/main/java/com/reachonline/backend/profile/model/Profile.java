package com.reachonline.backend.profile.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "display_name", nullable = false, length = 160)
    private String displayName;

    @Column(length = 2000)
    private String bio;

    @Column(length = 500)
    private String website;

    @Column(name = "is_public", nullable = false)
    private boolean publicProfile;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Profile() {}

    public Profile(
            String userId,
            String displayName,
            String bio,
            String website,
            boolean publicProfile
    ) {
        this.userId = userId;
        this.displayName = displayName;
        this.bio = bio;
        this.website = website;
        this.publicProfile = publicProfile;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getBio() {
        return bio;
    }

    public String getWebsite() {
        return website;
    }

    public boolean isPublicProfile() {
        return publicProfile;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(
            String displayName,
            String bio,
            String website,
            boolean publicProfile
    ) {
        this.displayName = displayName;
        this.bio = bio;
        this.website = website;
        this.publicProfile = publicProfile;
    }
}
