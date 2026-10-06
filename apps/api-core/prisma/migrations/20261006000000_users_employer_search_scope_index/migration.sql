-- S6-VV-132 (#587): every employer candidate search filters by role + discoverableToEmployers,
-- then institutionId when scoped. Without this, each search is a sequential scan over all users.
CREATE INDEX "idx_users_employer_search_scope" ON "users"("role", "discoverable_to_employers", "institution_id");
