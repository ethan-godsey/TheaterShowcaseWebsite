-- Ellie Evens — schema. Idempotent: safe to re-run until real data exists,
-- at which point changes graduate to proper migrations.
-- Design notes live in MTShowcaseWebsite/ARCHITECTURE.md.

CREATE TABLE IF NOT EXISTS shows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT        NOT NULL,
  role                TEXT        NOT NULL,
  venue               TEXT        NOT NULL,
  -- DATE, not TIMESTAMPTZ: a performance date is a calendar date, no timezone.
  date                DATE        NOT NULL,
  production_company  TEXT,
  director            TEXT,
  poster_key          TEXT,
  is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order          INT         NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shows_date_idx ON shows (date DESC);

CREATE TABLE IF NOT EXISTS photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  s3_key      TEXT NOT NULL UNIQUE,
  caption     TEXT NOT NULL DEFAULT '',
  alt_text    TEXT NOT NULL DEFAULT '',
  width       INT,
  height      INT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  -- Production shots point at their show; NULL = general gallery/headshot.
  -- Deleting a show demotes its photos to the gallery instead of losing them.
  show_id     UUID REFERENCES shows(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photos_show_idx ON photos (show_id);
CREATE INDEX IF NOT EXISTS photos_tags_idx ON photos USING GIN (tags);

CREATE TABLE IF NOT EXISTS media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              TEXT NOT NULL CHECK (kind IN ('reel', 'song')),
  title             TEXT NOT NULL,
  -- Reels are embedded (Vimeo/YouTube host the video); songs live in S3.
  embed_url         TEXT,
  s3_key            TEXT,
  category          TEXT,
  duration_seconds  INT,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A reel without a URL or a song without a file is unrepresentable.
  CONSTRAINT media_reel_needs_url  CHECK (kind <> 'reel' OR embed_url IS NOT NULL),
  CONSTRAINT media_song_needs_file CHECK (kind <> 'song' OR s3_key    IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one row, enforced by the primary key: it can only ever be TRUE.
CREATE TABLE IF NOT EXISTS profile (
  id               BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  bio              TEXT NOT NULL DEFAULT '',
  headline         TEXT NOT NULL DEFAULT '',
  voice_type       TEXT NOT NULL DEFAULT '',
  range_low        TEXT NOT NULL DEFAULT '',
  range_high       TEXT NOT NULL DEFAULT '',
  height_inches    INT,
  headshot_key     TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
