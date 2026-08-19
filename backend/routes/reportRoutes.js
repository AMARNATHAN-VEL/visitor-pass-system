const express = require("express");
const {
  getDashboardMetrics,
  getActivityLogs,
  getVisitorAnalytics,
} = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All report routes require authentication
router.use(protect);

// @route   GET /api/reports/dashboard
// @desc    Get admin dashboard metrics
// @access  Admin
router.get("/dashboard", authorizeRoles("Admin"), getDashboardMetrics);

// @route   GET /api/reports/activity-logs
// @desc    Get all activity logs (audit trail)
// @access  Admin
router.get("/activity-logs", authorizeRoles("Admin"), getActivityLogs);

// @route   GET /api/reports/analytics
// @desc    Get visitor traffic and status analytics for the last seven days
// @access  Admin, Receptionist, Employee
router.get(
  "/analytics",
  authorizeRoles("Admin", "Receptionist", "Employee"),
  getVisitorAnalytics,
);

module.exports = router;
