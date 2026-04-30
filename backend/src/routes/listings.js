const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createListing,
  getListings,
  getNearbyListings,
  getMyListings,
  updateListing,
  deleteListing,
  getListingDetails
} = require('../controllers/listingController');

router.post('/', authMiddleware, createListing);
router.get('/', getListings);
router.get('/nearby', getNearbyListings);
router.get('/my', authMiddleware, getMyListings);
router.get('/:id', getListingDetails);
router.put('/:id', authMiddleware, updateListing);
router.delete('/:id', authMiddleware, deleteListing);

module.exports = router;
