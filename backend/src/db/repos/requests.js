const db = require('../index');

async function createRequest({ listing_id, sender_id, owner_id, message }) {
  const res = await db.query(
    `INSERT INTO requests (listing_id, sender_id, owner_id, message)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [listing_id, sender_id, owner_id, message]
  );
  return res.rows[0];
}

async function getRequestsForOwner(owner_id) {
  const res = await db.query(
    `SELECT * FROM requests WHERE owner_id = $1 ORDER BY created_at DESC`,
    [owner_id]
  );
  return res.rows;
}

async function updateRequestStatus(id, owner_id, status) {
  const res = await db.query(
    `
    UPDATE requests
    SET status = $1
    WHERE id = $2 AND owner_id = $3
    RETURNING *
    `,
    [status, id, owner_id]
  );

  return res.rows[0] || null;
}

module.exports = {
  createRequest,
  getRequestsForOwner,
  updateRequestStatus
};