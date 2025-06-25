CREATE TABLE lab.print_requests (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    file_path TEXT NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.request_tags (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.request_tag_assignments (
    request_id INTEGER NOT NULL REFERENCES lab.print_requests(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES lab.request_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, tag_id)
);
