const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const {
  addFavorite,
  getFavorites,
  removeFavorite
} = require('../controllers/favoritesController');

router.post('/', authMiddleware, addFavorite);
router.get('/', authMiddleware, getFavorites);
router.delete('/:listing_id', authMiddleware, removeFavorite);

module.exports = router;