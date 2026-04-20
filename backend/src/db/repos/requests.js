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
    `
    SELECT 
      r.id,
      r.status,
      r.message,
      r.created_at,

      l.id AS listing_id,
      l.title,
      l.price,

      u.id AS sender_id,
      u.full_name AS sender_name,
      u.phone AS sender_phone,
      u.email AS sender_email,

      -- 🔥 WhatsApp link (always available to owner)
      'https://wa.me/' || REPLACE(u.phone, '+', '') AS whatsapp_link

    FROM requests r
    JOIN listings l ON r.listing_id = l.id
    JOIN users u ON r.sender_id = u.id

    WHERE r.owner_id = $1
    ORDER BY r.created_at DESC
    `,
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