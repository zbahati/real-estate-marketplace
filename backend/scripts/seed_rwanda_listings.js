require('dotenv').config();

const bcrypt = require('bcrypt');
const db = require('../src/db');

const OWNER_EMAIL = 'demo.rwanda.listings@example.com';

const listings = [
  {
    title: 'Modern Lake View Villa in Gisenyi',
    description: 'A bright family villa near Lake Kivu with a garden, secure parking, and easy access to town.',
    price: 185000000,
    currency: 'RWF',
    category: 'house',
    listing_type: 'sale',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 320,
    location: {
      address_line: 'Lake Kivu shoreline',
      city: 'Gisenyi',
      region: 'Western Province',
      country: 'Rwanda',
      lat: -1.7027,
      lng: 29.2564,
    },
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Kigali Rebero Family Home',
    description: 'A quiet hillside home with city views, modern finishes, and quick access to central Kigali.',
    price: 145000000,
    currency: 'RWF',
    category: 'house',
    listing_type: 'sale',
    bedrooms: 3,
    bathrooms: 3,
    sqft: 260,
    location: {
      address_line: 'Rebero hillside',
      city: 'Kigali',
      region: 'Kigali City',
      country: 'Rwanda',
      lat: -1.9975,
      lng: 30.0722,
    },
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Musanze Mountain Rental House',
    description: 'A furnished rental house near Musanze town with mountain views and a calm residential setting.',
    price: 850000,
    currency: 'RWF',
    category: 'house',
    listing_type: 'rent',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 190,
    location: {
      address_line: 'Musanze town road',
      city: 'Musanze',
      region: 'Northern Province',
      country: 'Rwanda',
      lat: -1.4998,
      lng: 29.634,
    },
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Huye Town Bungalow',
    description: 'A clean bungalow close to Huye services, suitable for a family or university staff housing.',
    price: 620000,
    currency: 'RWF',
    category: 'house',
    listing_type: 'rent',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 150,
    location: {
      address_line: 'Huye town center',
      city: 'Huye',
      region: 'Southern Province',
      country: 'Rwanda',
      lat: -2.5967,
      lng: 29.7394,
    },
    images: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Rwamagana New Build Home',
    description: 'A new single-family home with a spacious compound and convenient road access.',
    price: 78000000,
    currency: 'RWF',
    category: 'house',
    listing_type: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 210,
    location: {
      address_line: 'Rwamagana residential area',
      city: 'Rwamagana',
      region: 'Eastern Province',
      country: 'Rwanda',
      lat: -1.9487,
      lng: 30.4347,
    },
    images: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

async function ensureOwner(client) {
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [OWNER_EMAIL]);
  if (existing.rows[0]) return existing.rows[0].id;

  const passwordHash = await bcrypt.hash('demo-password-change-me', 10);
  const created = await client.query(
    `INSERT INTO users (email, password_hash, full_name, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [OWNER_EMAIL, passwordHash, 'Rwanda Demo Listings', '+250788000000']
  );

  return created.rows[0].id;
}

async function seedListing(client, ownerId, item) {
  await client.query(
    `DELETE FROM listings
     WHERE owner_id = $1 AND title = $2`,
    [ownerId, item.title]
  );

  const location = await client.query(
    `INSERT INTO locations (
      address_line, city, region, country, lat, lng, geo_location
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      ST_SetSRID(ST_MakePoint($6, $5), 4326)
    )
    RETURNING id`,
    [
      item.location.address_line,
      item.location.city,
      item.location.region,
      item.location.country,
      item.location.lat,
      item.location.lng,
    ]
  );

  const listing = await client.query(
    `INSERT INTO listings (
      owner_id, location_id, title, description, price, currency,
      category, listing_type, bedrooms, bathrooms, sqft, is_published
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
    RETURNING id`,
    [
      ownerId,
      location.rows[0].id,
      item.title,
      item.description,
      item.price,
      item.currency,
      item.category,
      item.listing_type,
      item.bedrooms,
      item.bathrooms,
      item.sqft,
    ]
  );

  for (const [index, url] of item.images.entries()) {
    await client.query(
      `INSERT INTO images (listing_id, url, "order")
       VALUES ($1, $2, $3)`,
      [listing.rows[0].id, url, index]
    );
  }

  return listing.rows[0].id;
}

async function main() {
  await db.transaction(async (client) => {
    const ownerId = await ensureOwner(client);
    const ids = [];

    for (const item of listings) {
      ids.push(await seedListing(client, ownerId, item));
    }

    console.log(`Seeded ${ids.length} Rwanda listings: ${ids.join(', ')}`);
  });
}

main()
  .catch((err) => {
    console.error('Failed to seed Rwanda listings', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.shutdown();
  });
