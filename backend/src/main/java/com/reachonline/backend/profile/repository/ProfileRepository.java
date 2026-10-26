package com.reachonline.backend.profile.repository;

import com.reachonline.backend.profile.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile, String> {

    List<Profile> findAllByPublicProfileTrueOrderByDisplayNameAsc();
}
