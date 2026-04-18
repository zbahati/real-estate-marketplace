const db = require('../index');

async function createLocation({
  address_line,
  city,
  region,
  country,
  postal_code,
  lat,
  lng
}) {
  const sql = `
    INSERT INTO locations (
      address_line, city, region, country, postal_code, lat, lng, geo_location
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      ST_SetSRID(ST_MakePoint($7, $6), 4326)
    )
    RETURNING *
  `;

  const res = await db.query(sql, [
    address_line,
    city,
    region,
    country,
    postal_code,
    lat,
    lng
  ]);

  return res.rows[0];
}

module.exports = {
  createLocation
};