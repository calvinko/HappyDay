-- Backfill `users` rows for the members already listed in BUILTIN_GROUPS
-- (src/lib/data.ts), so their accounts exist before they ever sign in.
--
-- username is the display_name with spaces stripped (e.g. "Calvin Ko" ->
-- "CalvinKo"). NOTE: this does NOT match usernameFor() in
-- src/components/HappyDayApp.tsx, which builds `${groupId}:${name.toLowerCase()}`
-- at sign-in time — so a member signing in through the app's own flow will
-- not match one of these rows and will register a new, separate account
-- instead. Keep that in mind if these rows are meant to be the same accounts
-- the app signs people into.
--
-- password_hash is a per-user bcrypt hash (12 rounds) of `<username>-43236`
-- (43236 is the app's INVITE_CODE). This does NOT match SERVER_PASSWORD in
-- HappyDayApp.tsx either, so these accounts can't be reached through the
-- app's own sign-in flow at all right now — see the username note above.
-- If INVITE_CODE ever changes, regenerate each row's hash:
--   node -e "require('bcrypt').hash('<username>-<new code>', 12).then(console.log)"
--
-- Safe to re-run: existing rows are matched by username and only
-- display_name/group_id are refreshed, so it won't overwrite a password a
-- member has since changed for real (via /api/auth routes, once that exists).
-- Keep this list in sync with BUILTIN_GROUPS if that changes.
--
-- id is set explicitly starting at 1001, so seeded rows stay easy to spot.
-- MySQL bumps the table's AUTO_INCREMENT counter past the highest id it
-- sees, so once this has run, real self-service registrations will get ids
-- from 1012 up — they won't start back at 1. On a conflict this only ever
-- matches by the username unique key (see above), not id — if a row with
-- the same username already exists under a different id, that id is left
-- as-is.

INSERT INTO users (id, username, password_hash, display_name, group_id) VALUES
  (1001, 'CalvinKo',    '$2b$12$CyTBvYAEATOgid4XfBKLxOl3pqi6r6PSNMKxjU2BrzAkQxu6lJ0Ru', 'Calvin Ko',    'sj_senior'),
  (1002, 'IvyChan',     '$2b$12$ogR/joN/2otS.YIwvXq2KOIRwE2Hw39epHoGgY6wBnlnXOsNH9yWi', 'Ivy Chan',     'sj_senior'),
  (1003, 'KwokChing',   '$2b$12$V40rn0sjvDotGnTt56sfYuSOguGWmMwp9Y73e/1kKshMKg0VCCYme', 'Kwok Ching',   'sj_senior'),
  (1004, 'MayTsui',     '$2b$12$rx7dU1l1KqopTazzE1pC6elOIwl8eKNdjqn1ZQlEJYgnDNxWa1CfC', 'May Tsui',     'sj_senior'),
  (1005, 'Catherine',   '$2b$12$lnluPfawkNLTr685sXg3K.lXxikhZrpcNIMSVXAMfZeahUMqLok46', 'Catherine',    'sj_senior'),
  (1006, 'RickNg',      '$2b$12$R22Y09WNA7QT96N4FnINzeWl2oRQNO3nrvb6VYuhgm8PK3JMCS8k2', 'Rick Ng',      'sj_senior'),
  (1007, 'YvonneHo',    '$2b$12$nYsW7zV7h8gzFGYdlz3JuO/RyF65LdQt9nNqq4fcQ.AxioFgdR1UG', 'Yvonne Ho',    'sj_senior'),
  (1008, 'JamesLeung',  '$2b$12$KlPAR8YNCQCj0XsDehHz8.mMyJ0Jh1peys65lQJNvRkOx5fANyjje', 'James Leung',  'sf_senior'),
  (1009, 'LindaChiu',   '$2b$12$dpxKARN3Ommg/4wfcMo8JuY9Z7EzPNkY0.MkGKt9H1bwnSQ78IKRm', 'Linda Chiu',   'sf_senior'),
  (1010, 'PatrickChiu', '$2b$12$V4a2OZIIiJ/NvaucT.xBTeB2hzBYJLbEE.XYjV5ExKI9kYF91J7jK', 'Patrick Chiu', 'sf_senior'),
  (1011, 'HonYuen',     '$2b$12$tNxn/D958N3NmABlx28PfuYm2uMYY2clJ77EuQxxnYqpU4hhgQ702', 'HonYuen',      'bra_senior')
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  group_id     = VALUES(group_id);
