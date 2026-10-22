
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(1000),
    agent_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE tools (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(1000),
    protocol VARCHAR(30) NOT NULL,
    endpoint VARCHAR(1000),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    contract_type VARCHAR(30) NOT NULL,
    version VARCHAR(80) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_contract_name_version UNIQUE (name, version)
);

CREATE TABLE agent_tool_dependencies (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),
    tool_id UUID NOT NULL REFERENCES tools(id),
    consumer_expectations TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_agent_tool UNIQUE (agent_id, tool_id)
);

CREATE TABLE governance_policies (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL UNIQUE,
    description VARCHAR(1000),
    rule_type VARCHAR(80) NOT NULL,
    configuration TEXT NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE release_reviews (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id),
    proposed_version VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL,
    findings TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_dependency_agent
    ON agent_tool_dependencies(agent_id);

CREATE INDEX idx_dependency_tool
    ON agent_tool_dependencies(tool_id);

CREATE INDEX idx_release_review_created
    ON release_reviews(created_at);
