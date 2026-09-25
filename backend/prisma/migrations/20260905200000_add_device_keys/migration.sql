-- Migration: add device_keys table
-- SQLite-compatible for local dev and Postgres-friendly enough for staging/prod.

CREATE TABLE IF NOT EXISTS device_keys (
  id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  revoked_at DATETIME,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS device_keys_owner_idx ON device_keys(owner_user_id);
CREATE INDEX IF NOT EXISTS device_keys_tenant_idx ON device_keys(tenant_id);
