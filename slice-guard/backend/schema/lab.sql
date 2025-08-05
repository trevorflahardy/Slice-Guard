CREATE SCHEMA IF NOT EXISTS lab;

CREATE TABLE lab.labs (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    default_role_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT labs_default_role_fkey FOREIGN KEY (default_role_id)
        REFERENCES lab.roles(id) ON DELETE SET NULL
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
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (lab_id, user_id)
);

CREATE TABLE lab.member_roles (
    lab_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL REFERENCES lab.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (lab_id, user_id, role_id),
    FOREIGN KEY (lab_id, user_id) REFERENCES lab.members(lab_id, user_id) ON DELETE CASCADE
);

CREATE TABLE lab.print_requests (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    file_data BYTEA NOT NULL DEFAULT ''::bytea,
    metadata JSONB NOT NULL,
    description TEXT,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.request_tags (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#9ca3af',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.request_tag_assignments (
    request_id INTEGER NOT NULL REFERENCES lab.print_requests(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES lab.request_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, tag_id)
);
