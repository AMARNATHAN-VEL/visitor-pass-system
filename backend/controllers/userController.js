const User = require('../models/User');

// @desc    Get all users (optionally filtered by role)
// @route   GET /api/users?role=Employee
// @access  Any authenticated user
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
};

module.exports = { getUsers };