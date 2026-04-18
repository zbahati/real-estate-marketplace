const db = require('../index');

// Add favorite
async function addFavorite(user_id, listing_id) {
  const sql = `
    INSERT INTO favorites (user_id, listing_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, listing_id) DO NOTHING
    RETURNING *
  `;
  const res = await db.query(sql, [user_id, listing_id]);
  return res.rows[0];
}

// Get all favorites for user
async function getUserFavorites(user_id) {
  const sql = `
    SELECT l.*
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;
  const res = await db.query(sql, [user_id]);
  return res.rows;
}

// Remove favorite
async function removeFavorite(user_id, listing_id) {
  const sql = `
    DELETE FROM favorites
    WHERE user_id = $1 AND listing_id = $2
  `;
  await db.query(sql, [user_id, listing_id]);
}

module.exports = {
  addFavorite,
  getUserFavorites,
  removeFavorite
};