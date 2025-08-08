-- Add optional color to lab roles for UI styling.
ALTER TABLE lab.roles
    ADD COLUMN IF NOT EXISTS color TEXT;
