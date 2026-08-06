const VisitRequest = require('../models/VisitRequest');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get admin dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Admin
const getDashboardMetrics = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [pendingRequests, todayVisitors, visitorsInside, totalEmployees] =
      await Promise.all([
        VisitRequest.countDocuments({ status: 'Pending' }),
        VisitRequest.countDocuments({
          visitDate: { $gte: startOfToday, $lte: endOfToday },
          status: { $ne: 'Cancelled' },
        }),
        VisitRequest.countDocuments({ status: 'CheckedIn' }),
        User.countDocuments({ role: 'Employee' }),
      ]);

    res.json({
      success: true,
      data: {
        pendingRequests,
        todayVisitors,
        visitorsInside,
        totalEmployees,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard metrics',
    });
  }
};

// @desc    Get all activity logs (audit trail)
// @route   GET /api/reports/activity-logs
// @access  Admin
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('performedBy', 'name email role')
      .populate('visitRequestId', 'status visitDate purpose')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity logs',
    });
  }
};

module.exports = { getDashboardMetrics, getActivityLogs };
