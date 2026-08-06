const express = require('express');
const {
  registerVisitor,
  updateVisitStatus,
  checkInVisitor,
  checkOutVisitor,
  getPendingVisits,
  getActiveVisits,
} = require('../controllers/visitorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All visitor routes require authentication
router.use(protect);

// @route   POST /api/visitors/register
// @desc    Register a new visitor and create a visit request
// @access  Receptionist
router.post('/register', authorizeRoles('Receptionist'), registerVisitor);

// @route   PATCH /api/visitors/:id/status
// @desc    Update visit request status (Approve/Reject)
// @access  Employee
router.patch('/:id/status', authorizeRoles('Employee'), updateVisitStatus);

// @route   PATCH /api/visitors/:id/check-in
// @desc    Check in a visitor
// @access  Receptionist
router.patch('/:id/check-in', authorizeRoles('Receptionist'), checkInVisitor);

// @route   PATCH /api/visitors/:id/check-out
// @desc    Check out a visitor
// @access  Receptionist
router.patch('/:id/check-out', authorizeRoles('Receptionist'), checkOutVisitor);

// @route   GET /api/visitors/pending
// @desc    Get pending visit requests for the logged-in employee
// @access  Employee
router.get('/pending', authorizeRoles('Employee'), getPendingVisits);

// @route   GET /api/visitors/active
// @desc    Get active visits (excludes Cancelled)
// @access  Any authenticated user
router.get('/active', getActiveVisits);

module.exports = router;