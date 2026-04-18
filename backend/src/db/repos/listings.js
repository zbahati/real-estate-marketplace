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
  is_published = false,
  category,
  listing_type

}) {
  const sql = `
    INSERT INTO listings (
      owner_id, location_id, title, description, price, currency, category, listing_type, bedrooms, bathrooms, sqft, is_published
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
  `;

  const res = await db.query(sql, [
    owner_id,
    location_id,
    title,
    description,
    price,
    currency,
    category,
    listing_type,
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

// async function getNearbyListings({
//   lat,
//   lng,
//   radiusKm = 5,
//   limit = 20,
//   category
// }) {
//   const clauses = [
//     `l.is_published = true`,
//     `loc.geo_location IS NOT NULL`,
//     `ST_DWithin(
//       loc.geo_location::geography,
//       ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
//       $3 * 1000
//     )`
//   ];

//   const params = [lat, lng, radiusKm];
//   let idx = 4;


//   if (category) {
//     clauses.push(`l.category = $${idx++}`);
//     params.push(category);
//   }

//   // Add limit at the end
//   params.push(limit);

//   const sql = `
//     SELECT 
//       l.*,
//       ST_Distance(
//         loc.geo_location::geography,
//         ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
//       ) AS distance
//     FROM listings l
//     JOIN locations loc ON l.location_id = loc.id
//     WHERE ${clauses.join(' AND ')}
//     ORDER BY distance ASC
//     LIMIT $${idx}
//   `;

//   const res = await db.query(sql, params);
//   return res.rows;
// }

async function getNearbyListings({
  lat,
  lng,
  radiusKm = 5,
  limit = 20,
  category,
  listing_type,
  minPrice,
  maxPrice
}) {
  const clauses = [
    `l.is_published = true`,
    `loc.geo_location IS NOT NULL`,
    `ST_DWithin(
      loc.geo_location::geography,
      ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
      $3 * 1000
    )`
  ];

  const params = [lat, lng, radiusKm];
  let idx = 4;

  // CATEGORY
  if (category) {
    clauses.push(`LOWER(l.category) = LOWER($${idx++})`);
    params.push(category);
  }

  // LISTING TYPE
  if (listing_type) {
    clauses.push(`LOWER(l.listing_type) = LOWER($${idx++})`);
    params.push(listing_type);
  }

  // MIN PRICE
  if (minPrice != null) {
    clauses.push(`l.price >= $${idx++}`);
    params.push(minPrice);
  }

  // MAX PRICE
  if (maxPrice != null) {
    clauses.push(`l.price <= $${idx++}`);
    params.push(maxPrice);
  }

  // LIMIT
  params.push(limit);

  const sql = `
    SELECT 
      l.*,
      ST_Distance(
        loc.geo_location::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
      ) AS distance
    FROM listings l
    JOIN locations loc ON l.location_id = loc.id
    WHERE ${clauses.join(' AND ')}
    ORDER BY distance ASC
    LIMIT $${idx}
  `;

  const res = await db.query(sql, params);
  return res.rows;
}

module.exports = {
  createListing,
  getListingById,
  searchListings,
  getNearbyListings
};
