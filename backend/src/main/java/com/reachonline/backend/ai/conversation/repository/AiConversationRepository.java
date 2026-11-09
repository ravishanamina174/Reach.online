
package com.reachonline.backend.ai.conversation.repository;

import com.reachonline.backend.ai.conversation.model.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiConversationRepository
        extends JpaRepository<AiConversation, UUID> {

    List<AiConversation> findAllByOwnerUserIdAndWorkspaceOrderByUpdatedAtDesc(
            String ownerUserId,
            String workspace
    );

    Optional<AiConversation> findByIdAndOwnerUserIdAndWorkspace(
            UUID id,
            String ownerUserId,
            String workspace
    );
}
