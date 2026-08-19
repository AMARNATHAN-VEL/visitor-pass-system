const VisitRequest = require("../models/VisitRequest");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

// @desc    Get admin dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Admin
const getDashboardMetrics = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [pendingRequests, todayVisitors, visitorsInside, totalEmployees] =
      await Promise.all([
        VisitRequest.countDocuments({ status: "Pending" }),
        VisitRequest.countDocuments({
          visitDate: { $gte: startOfToday, $lte: endOfToday },
          status: { $ne: "Cancelled" },
        }),
        VisitRequest.countDocuments({ status: "CheckedIn" }),
        User.countDocuments({ role: "Employee" }),
      ]);

    res.json({
      success: true,
      message: "Dashboard metrics retrieved successfully",
      data: {
        pendingRequests,
        todayVisitors,
        visitorsInside,
        totalEmployees,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all activity logs (audit trail)
// @route   GET /api/reports/activity-logs
// @access  Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate("performedBy", "name email role")
      .populate("visitRequestId", "status visitDate purpose")
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      message: "Activity logs retrieved successfully",
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visitor analytics for the last seven days
// @route   GET /api/reports/analytics
// @access  Admin, Receptionist, Employee
const getVisitorAnalytics = async (req, res, next) => {
  try {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const [trafficRows, statusRows] = await Promise.all([
      VisitRequest.aggregate([
        {
          $match: {
            visitDate: { $gte: startDate, $lte: endDate },
            status: { $ne: "Cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$visitDate" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      VisitRequest.aggregate([
        {
          $match: {
            visitDate: { $gte: startDate, $lte: endDate },
            status: { $in: ["CheckedIn", "CheckedOut"] },
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const trafficByDate = new Map(
      trafficRows.map((row) => [row._id, row.count]),
    );
    const traffic = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - offset);
      const dateKey = date.toISOString().slice(0, 10);
      traffic.push({
        date: dateKey,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: trafficByDate.get(dateKey) || 0,
      });
    }

    const statusCounts = Object.fromEntries(
      ["CheckedIn", "CheckedOut"].map((status) => [
        status,
        statusRows.find((row) => row._id === status)?.count || 0,
      ]),
    );

    res.json({
      success: true,
      message: "Visitor analytics retrieved successfully",
      data: { traffic, statusCounts },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getActivityLogs,
  getVisitorAnalytics,
};
