-- Add hierarchy rank to lab roles. Higher rank = higher precedence.
ALTER TABLE lab.roles
    ADD COLUMN IF NOT EXISTS rank INTEGER NOT NULL DEFAULT 0;

-- No data backfill required; existing roles default to rank 0.
