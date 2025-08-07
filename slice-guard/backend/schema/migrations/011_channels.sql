CREATE TABLE lab.channels (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    category_id INTEGER REFERENCES lab.channels(id) ON DELETE SET NULL,
    lab_id INTEGER REFERENCES lab.labs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    request_id INTEGER REFERENCES lab.print_requests(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES lab.channels(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_mentions INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    role_mentions INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    created_at TIMESTAMP DEFAULT NOW(),
    edited_at TIMESTAMP
);
