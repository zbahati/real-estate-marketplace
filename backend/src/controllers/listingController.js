const locationsRepo = require('../db/repos/locations');
const listingsRepo = require('../db/repos/listings');

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
    const { lat, lng, radius, category, minPrice, maxPrice } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const listings = await listingsRepo.getNearbyListings({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: radius ? Number(radius) : 5,
      category,
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