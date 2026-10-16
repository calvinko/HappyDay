-- One-off migration for databases created before resources gained kinds.
-- Run once, manually (not applied by init-db): mysql <db> < 001_resources_kinds.sql
-- Existing rows become kind = 'song' through the column default.
ALTER TABLE resources
  ADD COLUMN kind ENUM('song', 'message', 'text') NOT NULL DEFAULT 'song' AFTER group_id,
  ADD COLUMN title VARCHAR(200) NULL AFTER song_slug,
  ADD COLUMN url VARCHAR(500) NULL AFTER title,
  ADD COLUMN body TEXT NULL AFTER url,
  MODIFY COLUMN song_slug VARCHAR(50) NULL,
  DROP INDEX idx_resources_user,
  DROP INDEX idx_resources_group,
  ADD INDEX idx_resources_user (user_id, kind, sort_order),
  ADD INDEX idx_resources_group (group_id, kind, sort_order),
  ADD CONSTRAINT chk_resources_kind_fields CHECK (
    (kind = 'song' AND song_slug IS NOT NULL) OR
    (kind = 'message' AND title IS NOT NULL AND url IS NOT NULL) OR
    (kind = 'text' AND title IS NOT NULL AND body IS NOT NULL)
  );
