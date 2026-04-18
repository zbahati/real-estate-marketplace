const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createListing,
  getNearbyListings,
  getMyListings,
  updateListing,
  deleteListing
} = require('../controllers/listingController');

router.post('/', authMiddleware, createListing);
router.get('/nearby', getNearbyListings);
router.get('/my', authMiddleware, getMyListings);
router.put('/:id', authMiddleware, updateListing);
router.delete('/:id', authMiddleware, deleteListing);

module.exports = router;