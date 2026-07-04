-- ADR 0001: problems as relational rows, everything else as GeoJSON documents.
CREATE TABLE problems (
  id                 TEXT PRIMARY KEY,          -- client-generated UUID (also idempotency key)
  name               TEXT NOT NULL,
  grade              TEXT,
  subarea            TEXT,
  color              TEXT,
  sort_order         INTEGER,
  description        TEXT,
  lat                REAL NOT NULL,
  lng                REAL NOT NULL,
  line               TEXT,                      -- JSON [[x,y], ...] in topo pixel space
  topo_key           TEXT,                      -- R2 key prefix, e.g. "topos/{slug}"
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by_name  TEXT,
  submitted_by_email TEXT,                      -- PII: never exposed in public payloads
  user_id            TEXT,                      -- NULL until accounts exist
  device_id          TEXT,                      -- per-install UUID for local "my contributions"
  review_note        TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  reviewed_at        TEXT
);

CREATE TABLE documents (                        -- boulders, areas, subareas, subarea-centers
  name       TEXT PRIMARY KEY,
  geojson    TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
