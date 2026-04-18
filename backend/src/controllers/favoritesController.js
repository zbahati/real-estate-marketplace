const favoritesRepo = require('../db/repos/favorites');

// Add
async function addFavorite(req, res) {
  try {
    const { listing_id } = req.body;

     if (!listing_id) {
      return res.status(400).json({ message: 'listing_id is required' });
    }

    const favorite = await favoritesRepo.addFavorite(
      req.user.id,
      listing_id
    );

    if (!favorite) {
     return res.status(200).json({ message: 'Already in favorites' });
   }
    res.status(201).json(favorite);

    res.status(201).json(favorite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get
async function getFavorites(req, res) {
  try {
    const favorites = await favoritesRepo.getUserFavorites(req.user.id);
    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Remove
async function removeFavorite(req, res) {
  try {
    const { listing_id } = req.params;

    await favoritesRepo.removeFavorite(req.user.id, listing_id);

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite
};