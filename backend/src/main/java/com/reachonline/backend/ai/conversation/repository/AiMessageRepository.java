
package com.reachonline.backend.ai.conversation.repository;

import com.reachonline.backend.ai.conversation.model.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiMessageRepository
        extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversation_IdOrderByCreatedAtAsc(
            UUID conversationId
    );

    List<AiMessage> findTop12ByConversation_IdOrderByCreatedAtDesc(
            UUID conversationId
    );
}
