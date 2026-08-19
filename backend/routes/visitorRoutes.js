const express = require("express");
const {
  registerVisitor,
  updateVisitStatus,
  checkInVisitor,
  checkOutVisitor,
  extendVisitTime,
  getActiveQueues,
  reallotVisitor,
  getPendingVisits,
  getActiveVisits,
  bulkVisitorAction,
} = require("../controllers/visitorController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All visitor routes require authentication
router.use(protect);

// @route   POST /api/visitors/register
// @desc    Register a new visitor and create a visit request
// @access  Receptionist
router.post("/register", authorizeRoles("Receptionist"), registerVisitor);

// @route   PATCH /api/visitors/:id/status
// @desc    Update visit request status (Approve/Reject)
// @access  Employee
router.patch("/:id/status", authorizeRoles("Employee"), updateVisitStatus);

// @route   PATCH /api/visitors/:id/check-in
// @desc    Check in a visitor
// @access  Receptionist
router.patch("/:id/check-in", authorizeRoles("Receptionist"), checkInVisitor);

// @route   PATCH /api/visitors/:id/check-out
// @desc    Check out a visitor
// @access  Receptionist
router.patch("/:id/check-out", authorizeRoles("Receptionist"), checkOutVisitor);

// @route   POST /api/visitors/:id/extend-time
// @desc    Extend an active meeting by up to 10 minutes
// @access  Employee
router.post("/:id/extend-time", authorizeRoles("Employee"), extendVisitTime);

// @route   GET /api/visitors/active-queues
// @desc    Get ongoing meetings and waiting queues by employee
// @access  Admin, Receptionist
router.get(
  "/active-queues",
  authorizeRoles("Admin", "Receptionist"),
  getActiveQueues,
);

// @route   PUT /api/visitors/:id/reallot
// @desc    Move a queued visitor to another employee
// @access  Receptionist
router.put("/:id/reallot", authorizeRoles("Receptionist"), reallotVisitor);

// @route   GET /api/visitors/pending
// @desc    Get pending visit requests for the logged-in employee
// @access  Employee
router.get("/pending", authorizeRoles("Employee"), getPendingVisits);

// @route   GET /api/visitors/active
// @desc    Get active visits (excludes Cancelled)
// @access  Admin, Receptionist, Employee
router.get(
  "/active",
  authorizeRoles("Admin", "Receptionist", "Employee"),
  getActiveVisits,
);

// @route   POST /api/visitors/bulk-action
// @desc    Approve or check out multiple visit requests
// @access  Employee (approve) or Receptionist (check out)
router.post(
  "/bulk-action",
  authorizeRoles("Employee", "Receptionist"),
  bulkVisitorAction,
);

module.exports = router;
