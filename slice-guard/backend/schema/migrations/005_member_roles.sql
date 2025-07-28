ALTER TABLE lab.labs ADD COLUMN default_role_id INTEGER;
ALTER TABLE lab.labs ADD CONSTRAINT labs_default_role_fkey FOREIGN KEY (default_role_id)
    REFERENCES lab.roles(id) ON DELETE SET NULL;

ALTER TABLE lab.members DROP COLUMN role_id;

CREATE TABLE lab.member_roles (
    lab_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL REFERENCES lab.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (lab_id, user_id, role_id),
    FOREIGN KEY (lab_id, user_id) REFERENCES lab.members(lab_id, user_id) ON DELETE CASCADE
);
