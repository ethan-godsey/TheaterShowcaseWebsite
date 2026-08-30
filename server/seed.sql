-- Dev seed: the same four fictional shows the API has been hardcoding, so the
-- DB swap returns familiar data. Guarded — only fires into an empty table.
-- Replace with Ellie's real credits via the admin (or delete + re-insert).
INSERT INTO shows (title, role, venue, date)
SELECT * FROM (VALUES
  ('Into the Woods',           'Baker''s Wife', 'Fulton Theatre',        DATE '2026-11-04'),
  ('The Light in the Piazza',  'Clara',         'Signature Theatre',     DATE '2026-09-18'),
  ('Cabaret',                  'Sally Bowles',  'Olney Theatre Center',  DATE '2025-06-02'),
  ('Bright Star',              'Alice Murphy',  'University Mainstage',  DATE '2025-02-21')
) AS seed(title, role, venue, date)
WHERE NOT EXISTS (SELECT 1 FROM shows);

INSERT INTO profile (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;
