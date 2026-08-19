const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");

const sendControllerError = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message,
    error: message,
    data: null,
  });

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Admin only (or initial seed when no users exist)
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return sendControllerError(
        res,
        400,
        "Please provide name, email, and password",
      );
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendControllerError(res, 400, "User already exists");
    }

    // Determine if this is the initial seed (no users in DB yet)
    const userCount = await User.countDocuments();

    // If there are existing users, only Admin can register new users
    if (userCount > 0 && (!req.user || req.user.role !== "Admin")) {
      return sendControllerError(
        res,
        403,
        "Access denied. Only Admin can register new users.",
      );
    }

    // Validate role if provided
    const validRoles = ["Admin", "Receptionist", "Employee"];
    const assignedRole = role || "Employee";
    if (!validRoles.includes(assignedRole)) {
      return sendControllerError(
        res,
        400,
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      department,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          token: generateToken(user._id),
        },
      });
    } else {
      sendControllerError(res, 400, "Invalid user data");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendControllerError(res, 400, "Please provide email and password");
    }

    // Normalize email for consistent querying
    const cleanEmail = email.toLowerCase().trim();

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (user) {
      const isMatch = await user.matchPassword(password);

      // Check if user exists and password matches
      if (isMatch) {
        res.json({
          success: true,
          message: "Login successful",
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            token: generateToken(user._id),
          },
        });
      } else {
        sendControllerError(res, 401, "Invalid email or password");
      }
    } else {
      sendControllerError(res, 401, "Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };
