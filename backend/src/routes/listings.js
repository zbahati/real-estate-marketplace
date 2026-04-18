const express = require('express');
const router = express.Router();
const { createListing } = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');
const { getNearbyListings } = require('../controllers/listingController');


router.post('/', authMiddleware, createListing);
router.get('/nearby', getNearbyListings);

module.exports = router;