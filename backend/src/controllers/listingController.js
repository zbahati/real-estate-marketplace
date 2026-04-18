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

module.exports = {
  createListing,
  getNearbyListings
};