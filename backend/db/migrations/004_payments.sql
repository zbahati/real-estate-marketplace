BEGIN;

-- Track if contact is unlocked (future payment control)
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS contact_unlocked BOOLEAN DEFAULT false;


CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,

  request_id BIGINT REFERENCES requests(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,

  amount NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'RWF',

  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
  momo_ref TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;