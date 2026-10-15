-- Hero lede + billing and the site's paper (background) colour, editable from
-- the admin. All nullable and additive: existing rows are untouched, and the
-- site treats NULL and '' alike as "use the built-in default".
--
-- IF NOT EXISTS makes this safe to re-run.
ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS hero_lede    TEXT,
  ADD COLUMN IF NOT EXISTS hero_billing TEXT,
  ADD COLUMN IF NOT EXISTS paper_color  TEXT;
