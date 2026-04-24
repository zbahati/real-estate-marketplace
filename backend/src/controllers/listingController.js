const locationsRepo = require('../db/repos/locations');
const listingsRepo = require('../db/repos/listings');
const geoip = require('geoip-lite');
const requestIp = require('request-ip');

// Simple in-memory cache for geoip lookups to avoid repeated lookups for
// the same IP. TTL set to 24 hours.
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // ms
const geoCache = new Map(); // ip -> { ll: [lat,lng], expires }

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

async function getNearbyListings(req, res) {
  try {
    const { lat, lng, radius, category, minPrice, maxPrice, q, listing_type } = req.query;

    // Try to determine coords in this order:
    // 1. Query params `lat`/`lng`
    // 2. IP-based geolocation using geoip-lite (via `request-ip`)
    // 3. Default center (Gisenyi)
    const DEFAULT_LAT = process.env.DEFAULT_LAT ? Number(process.env.DEFAULT_LAT) : -1.701;
    const DEFAULT_LNG = process.env.DEFAULT_LNG ? Number(process.env.DEFAULT_LNG) : 29.256;

    let latNum = lat !== undefined ? Number(lat) : null;
    let lngNum = lng !== undefined ? Number(lng) : null;

    if (latNum === null || lngNum === null) {
      const ip = requestIp.getClientIp(req);
      const ll = lookupGeoFromIp(ip);
      if (ll) {
        if (latNum === null) latNum = ll[0];
        if (lngNum === null) lngNum = ll[1];
      }
    }

    if (latNum === null) latNum = DEFAULT_LAT;
    if (lngNum === null) lngNum = DEFAULT_LNG;

    const listings = await listingsRepo.getNearbyListings({
      lat: latNum,
      lng: lngNum,
      radiusKm: radius ? Number(radius) : 5,
      category,
      listing_type,
      q,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined
    });

    res.json(listings);

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
  getListingDetails,
  getNearbyListings,
  getMyListings,
  updateListing,
  deleteListing
};