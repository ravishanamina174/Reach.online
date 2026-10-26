CREATE TABLE profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(160) NOT NULL,
    bio VARCHAR(2000),
    website VARCHAR(500),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_profiles_public
    ON profiles(is_public, updated_at);
