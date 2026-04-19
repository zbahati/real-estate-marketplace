const db = require('../index');

async function addImage(listing_id, url) {
  const res = await db.query(
    `INSERT INTO images (listing_id, url) VALUES ($1, $2) RETURNING *`,
    [listing_id, url]
  );
  return res.rows[0];
}

async function getImagesByListing(listing_id) {
  const res = await db.query(
    `SELECT * FROM images WHERE listing_id = $1 ORDER BY "order" ASC`,
    [listing_id]
  );
  return res.rows;
}

module.exports = {
  addImage,
  getImagesByListing
};