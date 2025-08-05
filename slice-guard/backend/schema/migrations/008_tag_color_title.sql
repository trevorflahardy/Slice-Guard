ALTER TABLE lab.print_requests
    ADD COLUMN title TEXT;

ALTER TABLE lab.request_tags
    ADD COLUMN color TEXT NOT NULL DEFAULT '#9ca3af';
