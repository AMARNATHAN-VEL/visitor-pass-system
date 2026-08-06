const Visitor = require('../models/Visitor');
const VisitRequest = require('../models/VisitRequest');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Helper: Create an activity log entry
const logActivity = async (visitRequestId, action, performedBy) => {
  await ActivityLog.create({
    visitRequestId,
    action,
    performedBy,
  });
};

// @desc    Register a new visitor and create a visit request
// @route   POST /api/visitors/register
// @access  Receptionist
const registerVisitor = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      govtId,
      employeeId,
      purpose,
      visitDate,
      expectedArrivalTime,
    } = req.body;

    // --- Validate required fields ---
    if (!name || !phone || !govtId || !employeeId || !purpose || !visitDate || !expectedArrivalTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, govtId, employeeId, purpose, visitDate, and expectedArrivalTime',
      });
    }

    // --- Validate target employee exists ---
    const targetEmployee = await User.findById(employeeId);
    if (!targetEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Target employee not found',
      });
    }

    // --- Rule 3: visitDate cannot be in the past ---
    const visitDateObj = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (visitDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Visit date cannot be in the past',
      });
    }

    // --- Rule 4: If visit is today, expectedArrivalTime cannot be earlier than current time ---
    const isToday = visitDateObj.toDateString() === today.toDateString();
    if (isToday) {
      const now = new Date();
      const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM
      if (expectedArrivalTime < currentTimeStr) {
        return res.status(400).json({
          success: false,
          message: `Expected arrival time cannot be earlier than current time (${currentTimeStr})`,
        });
      }
    }

    // --- Find or create the visitor by govtId ---
    let visitor = await Visitor.findOne({ govtId });

    if (!visitor) {
      visitor = await Visitor.create({
        name,
        phone,
        email,
        govtId,
      });
    }

    // --- Rule 1 & 2: Block if visitor has an active visit or duplicate registration on same date ---
    const activeStatuses = ['Pending', 'Approved', 'CheckedIn'];
    const startOfDay = new Date(visitDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(visitDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingVisit = await VisitRequest.findOne({
      visitorId: visitor._id,
      $or: [
        // Rule 1: Active visit (Pending, Approved, CheckedIn)
        { status: { $in: activeStatuses } },
        // Rule 2: Duplicate registration on the same date
        {
          visitDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: 'Cancelled' },
        },
      ],
    });

    if (existingVisit) {
      return res.status(400).json({
        success: false,
        message: 'Visitor already has an active visit or is already registered for this date',
      });
    }

    // --- Rule 5: Target employee cannot have more than 3 pending requests awaiting approval ---
    const pendingCount = await VisitRequest.countDocuments({
      employeeId,
      status: 'Pending',
    });

    if (pendingCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Target employee already has 3 pending visit requests awaiting approval',
      });
    }

    // --- Create the visit request ---
    const visitRequest = await VisitRequest.create({
      visitorId: visitor._id,
      employeeId,
      purpose,
      visitDate: visitDateObj,
      expectedArrivalTime,
      status: 'Pending',
    });

    // --- Log ActivityLog ('Created') ---
    await logActivity(visitRequest._id, 'Created', req.user._id);

    res.status(201).json({
      success: true,
      data: {
        visitRequest,
        visitor,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during visitor registration',
    });
  }
};

// @desc    Update visit request status (Approve/Reject)
// @route   PATCH /api/visitors/:id/status
// @access  Employee
const updateVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Approved or Rejected',
      });
    }

    // Find the visit request
    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found',
      });
    }

    // Ensure the employee owns this visit request
    if (visitRequest.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own visit requests.',
      });
    }

    // Update status and remarks
    visitRequest.status = status;
    if (remarks) {
      visitRequest.remarks = remarks;
    }
    await visitRequest.save();

    // --- Log ActivityLog ('Approved' or 'Rejected') ---
    await logActivity(visitRequest._id, status, req.user._id);

    res.json({
      success: true,
      data: visitRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during status update',
    });
  }
};

// @desc    Check in a visitor
// @route   PATCH /api/visitors/:id/check-in
// @access  Receptionist
const checkInVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the visit request
    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found',
      });
    }

    // --- Rule 6 & 9: Can only check in if status is 'Approved' (block if 'Rejected') ---
    if (visitRequest.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check in a rejected visit request',
      });
    }

    // --- Rule 7: Block if already 'CheckedIn' ---
    if (visitRequest.status === 'CheckedIn') {
      return res.status(400).json({
        success: false,
        message: 'Visitor is already checked in',
      });
    }

    if (visitRequest.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Visit request must be Approved before check-in',
      });
    }

    // Update status to CheckedIn and set checkInTime
    visitRequest.status = 'CheckedIn';
    visitRequest.checkInTime = new Date();
    await visitRequest.save();

    // --- Log ActivityLog ('Checked In') ---
    await logActivity(visitRequest._id, 'Checked In', req.user._id);

    res.json({
      success: true,
      data: visitRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in',
    });
  }
};

// @desc    Check out a visitor
// @route   PATCH /api/visitors/:id/check-out
// @access  Receptionist
const checkOutVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the visit request
    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found',
      });
    }

    // Must be checked in first
    if (visitRequest.status !== 'CheckedIn') {
      return res.status(400).json({
        success: false,
        message: 'Visitor must be checked in before check-out',
      });
    }

    // --- Rule 8: checkOutTime must be later than checkInTime ---
    const checkOutTime = new Date();
    if (checkOutTime <= visitRequest.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Check-out time must be later than check-in time',
      });
    }

    // Update status to CheckedOut and set checkOutTime
    visitRequest.status = 'CheckedOut';
    visitRequest.checkOutTime = checkOutTime;
    await visitRequest.save();

    // --- Log ActivityLog ('Checked Out') ---
    await logActivity(visitRequest._id, 'Checked Out', req.user._id);

    res.json({
      success: true,
      data: visitRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-out',
    });
  }
};

// @desc    Get pending visit requests for the logged-in employee
// @route   GET /api/visitors/pending
// @access  Employee
const getPendingVisits = async (req, res) => {
  try {
    const pendingVisits = await VisitRequest.find({
      employeeId: req.user._id,
      status: 'Pending',
    })
      .populate('visitorId', 'name phone email govtId')
      .populate('employeeId', 'name email department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingVisits.length,
      data: pendingVisits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending visits',
    });
  }
};

// @desc    Get active visits
// @route   GET /api/visitors/active
// @access  Protected (any authenticated user)
const getActiveVisits = async (req, res) => {
  try {
    // --- Rule 10: Exclude 'Cancelled' visits from active lists ---
    const activeStatuses = ['Pending', 'Approved', 'CheckedIn', 'CheckedOut'];

    const activeVisits = await VisitRequest.find({
      status: { $in: activeStatuses },
    })
      .populate('visitorId', 'name phone email govtId')
      .populate('employeeId', 'name email department')
      .sort({ visitDate: 1, expectedArrivalTime: 1 });

    res.json({
      success: true,
      count: activeVisits.length,
      data: activeVisits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active visits',
    });
  }
};

module.exports = {
  registerVisitor,
  updateVisitStatus,
  checkInVisitor,
  checkOutVisitor,
  getPendingVisits,
  getActiveVisits,
};
