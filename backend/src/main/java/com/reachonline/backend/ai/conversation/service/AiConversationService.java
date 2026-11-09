
package com.reachonline.backend.ai.conversation.service;

import com.reachonline.backend.ai.conversation.model.AiConversation;
import com.reachonline.backend.ai.conversation.model.AiMessage;
import com.reachonline.backend.ai.conversation.repository.AiConversationRepository;
import com.reachonline.backend.ai.conversation.repository.AiMessageRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class AiConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    public AiConversationService(
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public AiConversation create(String ownerUserId, String workspace) {
        return conversationRepository.save(
                new AiConversation(ownerUserId, workspace)
        );
    }

    @Transactional(readOnly = true)
    public List<AiConversation> list(
            String ownerUserId,
            String workspace
    ) {
        return conversationRepository
                .findAllByOwnerUserIdAndWorkspaceOrderByUpdatedAtDesc(
                        ownerUserId,
                        workspace
                );
    }

    @Transactional(readOnly = true)
    public List<AiMessage> getMessages(
            UUID conversationId,
            String ownerUserId,
            String workspace
    ) {
        AiConversation conversation = findOwnedConversation(
                conversationId,
                ownerUserId,
                workspace
        );

        return messageRepository
                .findByConversation_IdOrderByCreatedAtAsc(
                        conversation.getId()
                );
    }

    @Transactional(readOnly = true)
    public List<ConversationTurn> getRecentContext(
            UUID conversationId,
            String ownerUserId,
            String workspace
    ) {
        AiConversation conversation = findOwnedConversation(
                conversationId,
                ownerUserId,
                workspace
        );

        List<AiMessage> recent =
                messageRepository
                        .findTop12ByConversation_IdOrderByCreatedAtDesc(
                                conversation.getId()
                        );

        Collections.reverse(recent);

        return recent.stream()
                .map(message -> new ConversationTurn(
                        message.getRole(),
                        message.getContent()
                ))
                .toList();
    }

    @Transactional
    public List<AiMessage> saveExchange(
            UUID conversationId,
            String ownerUserId,
            String workspace,
            String userMessage,
            String assistantMessage
    ) {
        AiConversation conversation = findOwnedConversation(
                conversationId,
                ownerUserId,
                workspace
        );

        conversation.setTitleFromFirstMessage(userMessage);
        conversation.touch();

        conversationRepository.save(conversation);

        AiMessage user = messageRepository.save(
                new AiMessage(conversation, "USER", userMessage)
        );

        AiMessage assistant = messageRepository.save(
                new AiMessage(conversation, "ASSISTANT", assistantMessage)
        );

        return List.of(user, assistant);
    }

    @Transactional
    public AiConversation rename(
            UUID conversationId,
            String ownerUserId,
            String workspace,
            String title
    ) {
        AiConversation conversation = findOwnedConversation(
                conversationId,
                ownerUserId,
                workspace
        );

        conversation.rename(title);

        return conversationRepository.save(conversation);
    }

    @Transactional
    public void delete(
            UUID conversationId,
            String ownerUserId,
            String workspace
    ) {
        AiConversation conversation = findOwnedConversation(
                conversationId,
                ownerUserId,
                workspace
        );

        conversationRepository.delete(conversation);
    }

    private AiConversation findOwnedConversation(
            UUID conversationId,
            String ownerUserId,
            String workspace
    ) {
        return conversationRepository
                .findByIdAndOwnerUserIdAndWorkspace(
                        conversationId,
                        ownerUserId,
                        workspace
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Conversation was not found."
                ));
    }
}
