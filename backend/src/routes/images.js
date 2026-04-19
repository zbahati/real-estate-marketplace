const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/imageController');

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  uploadImage
);

module.exports = router;