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

async function getListingDetails(id) {
  const sql = `
    SELECT 
      l.*,

      -- 📍 location
      json_build_object(
        'city', loc.city,
        'country', loc.country,
        'lat', loc.lat,
        'lng', loc.lng
      ) AS location,

      -- 🧑 owner
      json_build_object(
        'id', u.id,
        'name', u.full_name,
        'phone', u.phone
      ) AS owner,

      -- 🖼 images
      COALESCE(
        json_agg(
          json_build_object(
            'id', img.id,
            'url', img.url
          )
        ) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) AS images

    FROM listings l
    LEFT JOIN locations loc ON l.location_id = loc.id
    LEFT JOIN users u ON l.owner_id = u.id
    LEFT JOIN images img ON img.listing_id = l.id

    WHERE l.id = $1

    GROUP BY l.id, loc.id, u.id
  `;

  const res = await db.query(sql, [id]);
  return res.rows[0];
}

// async function getNearbyListings({
//   lat,
//   lng,
//   radiusKm = 5,
//   limit = 20,
//   category,
//   listing_type,
//   q,
//   minPrice,
//   maxPrice
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

//   // CATEGORY
//   if (category) {
//     clauses.push(`LOWER(l.category) = LOWER($${idx++})`);
//     params.push(category);
//   }

//   // SEARCH QUERY (title / description / city)
//   if (q) {
//     clauses.push(`(
//       LOWER(l.title) LIKE LOWER($${idx}) OR
//       LOWER(l.description) LIKE LOWER($${idx}) OR
//       LOWER(loc.city) LIKE LOWER($${idx}) OR
//       LOWER(l.listing_type) LIKE LOWER($${idx})
//     )`);
//     params.push(`%${q}%`);
//     idx++;
//   }

//   // LISTING TYPE
//   if (listing_type) {
//     clauses.push(`LOWER(l.listing_type) = LOWER($${idx++})`);
//     params.push(listing_type);
//   }

//   // MIN PRICE
//   if (minPrice != null) {
//     clauses.push(`l.price >= $${idx++}`);
//     params.push(minPrice);
//   }

//   // MAX PRICE
//   if (maxPrice != null) {
//     clauses.push(`l.price <= $${idx++}`);
//     params.push(maxPrice);
//   }

//   // LIMIT
//   params.push(limit);

//   const sql = `
//   SELECT 
//     l.*,

//     -- ✅ Attach images
//     COALESCE(
//       json_agg(
//         json_build_object(
//           'id', img.id,
//           'url', img.url
//         )
//       ) FILTER (WHERE img.id IS NOT NULL),
//       '[]'
//     ) AS images,

//     -- ✅ Distance
//     MIN(
//       ST_Distance(
//         loc.geo_location::geography,
//         ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
//       )
//     ) AS distance

//   FROM listings l
//   JOIN locations loc ON l.location_id = loc.id

//   -- ✅ Join images
//   LEFT JOIN images img ON img.listing_id = l.id

//   WHERE ${clauses.join(' AND ')}

//   -- ✅ Required for aggregation
//   GROUP BY l.id, loc.geo_location

//   ORDER BY distance ASC
//   LIMIT $${idx}
// `;

//   const res = await db.query(sql, params);
//   return res.rows;
// }

// Get listings by owner


async function getNearbyListings({
  lat,
  lng,
  radiusKm = 5,
  limit = 20,
  category,
  listing_type,
  q,
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

  // Category
  if (category) {
    clauses.push(`LOWER(l.category) = LOWER($${idx++})`);
    params.push(category);
  }

  // Search query
  if (q) {
    clauses.push(`(
      LOWER(l.title) LIKE LOWER($${idx}) OR
      LOWER(l.description) LIKE LOWER($${idx}) OR
      LOWER(loc.city) LIKE LOWER($${idx}) OR
      LOWER(l.listing_type) LIKE LOWER($${idx})
    )`);
    params.push(`%${q}%`);
    idx++;
  }

  // Listing type
  if (listing_type) {
    clauses.push(`LOWER(l.listing_type) = LOWER($${idx++})`);
    params.push(listing_type);
  }

  // Min price
  if (minPrice != null) {
    clauses.push(`l.price >= $${idx++}`);
    params.push(minPrice);
  }

  // Max price
  if (maxPrice != null) {
    clauses.push(`l.price <= $${idx++}`);
    params.push(maxPrice);
  }

  // Limit
  params.push(limit);

  const sql = `
    SELECT 
      l.*,
      loc.lat,           -- ✅ Use stored latitude column
      loc.lng,           -- ✅ Use stored longitude column
      ST_Distance(
        loc.geo_location::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
      ) / 1000 AS distance,  -- ✅ Distance in km
      COALESCE(
        json_agg(
          json_build_object('id', img.id, 'url', img.url)
        ) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) AS images
    FROM listings l
    JOIN locations loc ON l.location_id = loc.id
    LEFT JOIN images img ON img.listing_id = l.id
    WHERE ${clauses.join(' AND ')}
    GROUP BY l.id, loc.lat, loc.lng, loc.geo_location
    ORDER BY distance ASC
    LIMIT $${idx}
  `;

  const res = await db.query(sql, params);
  return res.rows;
}




async function getListingsByOwner(owner_id) {
  const sql = `
    SELECT 
      l.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', img.id,
            'url', img.url
          )
        ) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) AS images
    FROM listings l
    LEFT JOIN images img ON img.listing_id = l.id
    WHERE l.owner_id = $1
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `;

  const res = await db.query(sql, [owner_id]);
  return res.rows;
}

// Update listing
async function updateListing(id, owner_id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (let key in data) {
    fields.push(`${key} = $${idx++}`);
    values.push(data[key]);
  }

  values.push(id);
  values.push(owner_id);

  const sql = `
    UPDATE listings
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idx++} AND owner_id = $${idx}
    RETURNING *
  `;

  const res = await db.query(sql, values);
  return res.rows[0];
}

// Delete listing
async function deleteListing(id, owner_id) {
  const res = await db.query(
    `DELETE FROM listings WHERE id = $1 AND owner_id = $2 RETURNING *`,
    [id, owner_id]
  );
  return res.rows[0];
}

async function getListingById(id) {
  const res = await db.query(
    `SELECT * FROM listings WHERE id = $1`,
    [id]
  );

  return res.rows[0] || null;
}

module.exports = {
  createListing,
  getNearbyListings,
  getListingsByOwner,
  getListingById,
  updateListing,
  deleteListing,
  getListingDetails
};
