const express = require('express');
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// @route   GET /api/users
// @desc    Get all users (optionally filtered by role via ?role=Employee)
// @access  Protected (any authenticated user)
router.get('/', getUsers);

module.exports = router;