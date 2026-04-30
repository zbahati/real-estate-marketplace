const locationsRepo = require('../db/repos/locations');
const listingsRepo = require('../db/repos/listings');
const geoip = require('geoip-lite');
const requestIp = require('request-ip');


// Simple in-memory cache for geoip lookups to avoid repeated lookups for
// the same IP. TTL set to 24 hours.
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // ms
const geoCache = new Map(); // ip -> { ll: [lat,lng], expires }

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampNumber(value, fallback, min, max) {
  const parsed = parseNumber(value);
  if (parsed === null) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function lookupGeoFromIp(ip) {
  if (!ip) return null;
  const now = Date.now();
  const cached = geoCache.get(ip);
  if (cached && cached.expires > now) return cached.ll;

  try {
    const geo = geoip.lookup(ip);
    if (geo && Array.isArray(geo.ll)) {
      const ll = geo.ll;
      geoCache.set(ip, { ll, expires: now + GEO_CACHE_TTL });
      return ll;
    }
  } catch (err) {
    console.error('geoip lookup failed', err);
  }
  return null;
}

async function createListing(req, res) {
  try {
    const {
      title,
      description,
      price,
      city,
      country,
      lat,
      lng,
      category,
      listing_type
    } = req.body;

    // 1. Create location
    const location = await locationsRepo.createLocation({
      city,
      country,
      lat,
      lng
    });

    // 2. Create listing
    const listing = await listingsRepo.createListing({
      owner_id: req.user.id,
      location_id: location.id,
      title,
      description,
      price,
      category,
      listing_type
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getListingDetails(req, res) {
  try {
    const { id } = req.params;

    const listing = await listingsRepo.getListingDetails(id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getListings(req, res) {
  try {
    const { limit, category, minPrice, maxPrice, q, listing_type } = req.query;

    const parsedLimit = Math.round(clampNumber(limit, 50, 1, 100));

    const parsedMinPrice =
      minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined;

    const parsedMaxPrice =
      maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined;

    const listings = await listingsRepo.getPublicListings({
      limit: parsedLimit,
      category,
      listing_type,
      q,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice
    });

    return res.json({
      success: true,
      data: listings,
      meta: {
        source: 'public',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getNearbyListings(req, res) {
  try {
    const { lat, lng, radius, limit, category, minPrice, maxPrice, q, listing_type } = req.query;

    // Try to determine coords in this order:
    // 1. Query params `lat`/`lng`
    // 2. IP-based geolocation using geoip-lite (via `request-ip`)
    // 3. Default center (Gisenyi)
    const DEFAULT_LAT = process.env.DEFAULT_LAT ? Number(process.env.DEFAULT_LAT) : -1.701;
    const DEFAULT_LNG = process.env.DEFAULT_LNG ? Number(process.env.DEFAULT_LNG) : 29.256;

    let latNum = parseNumber(lat);
    let lngNum = parseNumber(lng);
    let source = latNum !== null && lngNum !== null ? 'query' : 'fallback';

    if (latNum === null || lngNum === null) {
      try {
        const ip = requestIp.getClientIp(req);
        const ll = lookupGeoFromIp(ip);
        if (ll && Array.isArray(ll) && ll.length === 2) {
          latNum = ll[0];
          lngNum = ll[1];
          source = 'ip';
        }
      } catch (err) {
        console.error('Failed to get geo from IP', err);
      }
    }

    if (latNum === null || lngNum === null) {
      latNum = DEFAULT_LAT;
      lngNum = DEFAULT_LNG;
      source = 'default';
    }

    const radiusKm = clampNumber(radius, 5, 1, 200);
    const parsedLimit = Math.round(clampNumber(limit, 20, 1, 100));

    const parsedMinPrice =
      minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined;

    const parsedMaxPrice =
      maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined;

    let listings = await listingsRepo.getNearbyListings({
      lat: latNum,
      lng: lngNum,
      radiusKm: radiusKm,
      limit: parsedLimit,
      category,
      listing_type,
      q,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice
    });

    if (listings.length === 0 && source === 'query') {
      listings = await listingsRepo.getNearbyListings({
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        radiusKm: radiusKm,
        limit: parsedLimit,
        category,
        listing_type,
        q,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice
      });

      if (listings.length > 0) {
        latNum = DEFAULT_LAT;
        lngNum = DEFAULT_LNG;
        source = 'default_after_empty_query';
      }
    }

    return res.json({
      success: true,
      data: listings,
      meta: {
        usedLat: latNum,
        usedLng: lngNum,
        source,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get my listings
async function getMyListings(req, res) {
  try {
    const listings = await listingsRepo.getListingsByOwner(req.user.id);
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update listing
async function updateListing(req, res) {
  try {
    const { id } = req.params;

    const { title, description, price, currency, category, listing_type,
      bedrooms, bathrooms, sqft, is_published } = req.body;
    const updateData = Object.fromEntries(
      Object.entries({ title, description, price, currency, category, listing_type, bedrooms, bathrooms, sqft, is_published })
        .filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const updated = await listingsRepo.updateListing(
      id,
      req.user.id,
      updateData
    );

    if (!updated) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Delete listing
async function deleteListing(req, res) {
  try {
    const { id } = req.params;

    const deleted = await listingsRepo.deleteListing(
      id,
      req.user.id
    );

    if (!deleted) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createListing,
  getListings,
  getListingDetails,
  getNearbyListings,
  getMyListings,
  updateListing,
  deleteListing
};
