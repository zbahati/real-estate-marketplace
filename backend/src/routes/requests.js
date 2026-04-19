const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createRequest,
  getMyRequests,
  updateRequestStatus
} = require('../controllers/requestController');

router.post('/', authMiddleware, createRequest);
router.get('/my', authMiddleware, getMyRequests);
router.patch('/:id', authMiddleware, updateRequestStatus);

module.exports = router;