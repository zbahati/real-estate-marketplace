BEGIN;

CREATE TABLE IF NOT EXISTS requests (
  id BIGSERIAL PRIMARY KEY,

  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_owner ON requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_sender ON requests(sender_id);

COMMIT;