CREATE SCHEMA IF NOT EXISTS lab;

CREATE TABLE lab.labs (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.roles (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.members (
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES lab.roles(id) ON DELETE SET NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (lab_id, user_id)
);
