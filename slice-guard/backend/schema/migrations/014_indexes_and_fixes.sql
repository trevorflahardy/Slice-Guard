-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_members_user_id ON lab.members(user_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_user_lab ON lab.member_roles(user_id, lab_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_lab_id ON lab.print_requests(lab_id);
CREATE INDEX IF NOT EXISTS idx_channels_lab_id ON lab.channels(lab_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON lab.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON auth.api_keys(key);
CREATE INDEX IF NOT EXISTS idx_invites_code ON lab.invites(code);

-- Fix invite_uses PK (currently only invite_id, should be composite)
ALTER TABLE lab.invite_uses DROP CONSTRAINT invite_uses_pkey;
ALTER TABLE lab.invite_uses ADD PRIMARY KEY (invite_id, user_id);
