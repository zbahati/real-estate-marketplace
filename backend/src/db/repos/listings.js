const db = require('../index');

async function createListing({
  owner_id,
  location_id,
  title,
  description,
  price,
  currency = 'RWF',
  bedrooms,
  bathrooms,
  sqft,
  is_published = false
}) {
  const sql = `
    INSERT INTO listings (
      owner_id, location_id, title, description, price, currency, bedrooms, bathrooms, sqft, is_published
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `;

  const res = await db.query(sql, [
    owner_id,
    location_id,
    title,
    description,
    price,
    currency,
    bedrooms,
    bathrooms,
    sqft,
    is_published
  ]);

  return res.rows[0];
}

async function getListingById(id) {
  const res = await db.query('SELECT * FROM listings WHERE id = $1', [id]);
  return res.rows[0] || null;
}

// Simple paginated search with optional min/max price and published filter
async function searchListings({ limit = 20, offset = 0, minPrice, maxPrice, publishedOnly = true }) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (publishedOnly) {
    clauses.push(`is_published = true`);
  }
  if (minPrice != null) {
    clauses.push(`price >= $${idx++}`);
    params.push(minPrice);
  }
  if (maxPrice != null) {
    clauses.push(`price <= $${idx++}`);
    params.push(maxPrice);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  params.push(limit);
  params.push(offset);

  const sql = `SELECT * FROM listings ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  const res = await db.query(sql, params);
  return res.rows;
}

async function getNearbyListings({ lat, lng, radiusKm = 5, limit = 20 }) {
  const sql = `
    SELECT 
      l.*,
      ST_Distance(
        loc.geo_location::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
      ) AS distance
    FROM listings l
    JOIN locations loc ON l.location_id = loc.id
    WHERE l.is_published = true
      AND loc.geo_location IS NOT NULL
      AND ST_DWithin(
        loc.geo_location::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3 * 1000
      )
    ORDER BY distance ASC
    LIMIT $4
  `;

  const res = await db.query(sql, [
    lat,
    lng,
    radiusKm,
    limit
  ]);

  return res.rows;
}

module.exports = {
  createListing,
  getListingById,
  searchListings,
  getNearbyListings
};
