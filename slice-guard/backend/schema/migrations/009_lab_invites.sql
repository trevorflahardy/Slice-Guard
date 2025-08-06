CREATE TABLE lab.invites (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES lab.labs(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    max_uses INTEGER,
    uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab.invite_uses (
    invite_id INTEGER NOT NULL REFERENCES lab.invites(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (invite_id, user_id)
);
