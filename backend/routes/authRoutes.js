const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only, or initial seed when no users exist)
// @access  Admin only / Public (seed)
router.post('/register', optionalProtect, registerUser);

// @route   POST /api/auth/login
// @desc    Login user and return JWT token + user info
// @access  Public
router.post('/login', loginUser);

module.exports = router;