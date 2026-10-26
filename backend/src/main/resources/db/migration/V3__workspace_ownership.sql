ALTER TABLE agents ADD COLUMN owner_user_id VARCHAR(255);
ALTER TABLE tools ADD COLUMN owner_user_id VARCHAR(255);
ALTER TABLE contracts ADD COLUMN owner_user_id VARCHAR(255);
ALTER TABLE agent_tool_dependencies ADD COLUMN owner_user_id VARCHAR(255);
ALTER TABLE governance_policies ADD COLUMN owner_user_id VARCHAR(255);
ALTER TABLE release_reviews ADD COLUMN owner_user_id VARCHAR(255);

UPDATE agents SET owner_user_id = '__DEMO__' WHERE owner_user_id IS NULL;
UPDATE tools SET owner_user_id = '__DEMO__' WHERE owner_user_id IS NULL;
UPDATE contracts SET owner_user_id = '__DEMO__' WHERE owner_user_id IS NULL;
UPDATE agent_tool_dependencies SET owner_user_id = '__DEMO__' WHERE owner_user_id IS NULL;
UPDATE governance_policies SET owner_user_id = '__DEMO__' WHERE owner_user_id IS NULL;
UPDATE release_reviews SET owner_user_id = '__DEMO__' WHERE owner_user_id IS NULL;

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_name_key;
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_name_key;
ALTER TABLE governance_policies DROP CONSTRAINT IF EXISTS governance_policies_name_key;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS uq_contract_name_version;
ALTER TABLE agent_tool_dependencies DROP CONSTRAINT IF EXISTS uq_agent_tool;

CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_workspace_name
    ON agents (name, owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tool_workspace_name
    ON tools (name, owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_policy_workspace_name
    ON governance_policies (name, owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_contract_workspace_version
    ON contracts (name, version, owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_dependency_workspace_pair
    ON agent_tool_dependencies (agent_id, tool_id, owner_user_id);

CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tools_owner ON tools(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_owner ON contracts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_owner ON agent_tool_dependencies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_policies_owner ON governance_policies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_owner ON release_reviews(owner_user_id);
