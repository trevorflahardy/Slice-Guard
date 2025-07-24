ALTER TABLE lab.print_requests
    ADD COLUMN file_data BYTEA NOT NULL DEFAULT ''::bytea;
ALTER TABLE lab.print_requests
    DROP COLUMN file_path;
