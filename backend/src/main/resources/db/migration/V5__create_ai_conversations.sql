
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY,
    owner_user_id VARCHAR(255) NOT NULL,
    workspace VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL DEFAULT 'New chat',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ai_conversation_workspace
        CHECK (workspace IN ('DEMO', 'PERSONAL'))
);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES ai_conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ai_message_role
        CHECK (role IN ('USER', 'ASSISTANT'))
);

CREATE INDEX idx_ai_conversations_owner_workspace_updated
    ON ai_conversations(owner_user_id, workspace, updated_at DESC);

CREATE INDEX idx_ai_messages_conversation_created
    ON ai_messages(conversation_id, created_at ASC);
