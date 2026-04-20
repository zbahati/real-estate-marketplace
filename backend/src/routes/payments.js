const express = require('express');
const router = express.Router();
const { payForContact } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/unlock', authMiddleware, payForContact);

module.exports = router;