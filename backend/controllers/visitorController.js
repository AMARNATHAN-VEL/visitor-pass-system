const crypto = require("crypto");
const mongoose = require("mongoose");
const Visitor = require("../models/Visitor");
const VisitRequest = require("../models/VisitRequest");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const sendSMS = require("../utils/sendSMS");

const MAX_QUEUE_SIZE = 3;
const DEFAULT_MEETING_MINUTES = 30;

const sendControllerError = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message,
    error: message,
    data: null,
  });

// Helper: Create an activity log entry
const logActivity = async (visitRequestId, action, performedBy) => {
  await ActivityLog.create({
    visitRequestId,
    action,
    performedBy,
  });
};

const generatePassCode = () =>
  crypto.randomBytes(4).toString("hex").toUpperCase();

const getExpectedEndTime = (visitDate, expectedArrivalTime) => {
  const [hours, minutes] = expectedArrivalTime.split(":").map(Number);
  const endTime = new Date(visitDate);
  endTime.setHours(hours, minutes + DEFAULT_MEETING_MINUTES, 0, 0);
  return endTime;
};

const getEmployeeCapacity = async (employeeId, session) => {
  const [ongoingCount, queueCount] = await Promise.all([
    VisitRequest.countDocuments({
      assignedEmployee: employeeId,
      meetingStatus: "ONGOING",
    }).session(session),
    VisitRequest.countDocuments({
      assignedEmployee: employeeId,
      meetingStatus: "IN_QUEUE",
    }).session(session),
  ]);
  return { ongoingCount, queueCount };
};

const findAvailableEmployee = async (department, preferredEmployeeId) => {
  const employees = await User.find({
    role: "Employee",
    department,
    ...(preferredEmployeeId ? { _id: preferredEmployeeId } : {}),
  }).sort({ createdAt: 1 });

  for (const employee of employees) {
    const { queueCount } = await getEmployeeCapacity(employee._id);
    if (queueCount < MAX_QUEUE_SIZE) {
      return employee;
    }
  }

  return null;
};

const promoteNextQueuedVisitor = async (employeeId) => {
  const nextVisit = await VisitRequest.findOne({
    assignedEmployee: employeeId,
    meetingStatus: "IN_QUEUE",
  }).sort({ queuePosition: 1, createdAt: 1 });

  if (!nextVisit) return null;

  const previousQueuePosition = nextVisit.queuePosition;
  nextVisit.meetingStatus = "ONGOING";
  nextVisit.queuePosition = undefined;
  await nextVisit.save();

  await VisitRequest.updateMany(
    {
      assignedEmployee: employeeId,
      meetingStatus: "IN_QUEUE",
      queuePosition: { $gt: previousQueuePosition },
    },
    { $inc: { queuePosition: -1 } },
  );

  return nextVisit;
};

const notifyVisitParties = async ({ visitRequest, visitor, host, event }) => {
  const recipients = [visitor?.email, host?.email].filter(Boolean);

  const visitorName = visitor?.name || "Visitor";
  const hostName = host?.name || "Host";
  const eventLabel =
    event === "created"
      ? "created"
      : event === "approved"
        ? "approved"
        : event === "checkedOut"
          ? "checked out"
          : "checked in";
  const passCode = visitRequest.passCode || visitRequest._id.toString();
  const message = [
    `Hello ${visitorName},`,
    "",
    `Your visitor pass has been ${eventLabel}.`,
    `Pass code: ${passCode}`,
    `Host: ${hostName}`,
    `Visit date: ${new Date(visitRequest.visitDate).toLocaleDateString()}`,
    `Expected arrival: ${visitRequest.expectedArrivalTime}`,
    `Status: ${visitRequest.status}`,
    "",
    "Please keep this information available when you arrive.",
  ].join("\n");

  try {
    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `Visitor pass ${eventLabel}: ${passCode}`,
        text: message,
      });
    }
  } catch (error) {
    console.error(
      `Notification email failed for ${eventLabel} pass:`,
      error.message,
    );
  }

  try {
    await sendSMS({ to: visitor?.phone, message });
  } catch (error) {
    console.error(
      `Notification SMS failed for ${eventLabel} pass:`,
      error.message,
    );
  }
};

// @desc    Register a new visitor and create a visit request
// @route   POST /api/visitors/register
// @access  Receptionist
const registerVisitor = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      govtId,
      employeeId,
      targetDepartment,
      company,
      purpose,
      visitDate,
      expectedArrivalTime,
    } = req.body;

    // --- Validate required fields ---
    if (
      !name ||
      !phone ||
      !govtId ||
      (!employeeId && !targetDepartment) ||
      !purpose ||
      !visitDate ||
      !expectedArrivalTime
    ) {
      return sendControllerError(
        res,
        400,
        "Please provide name, phone, govtId, employeeId or targetDepartment, purpose, visitDate, and expectedArrivalTime",
      );
    }

    // --- Validate target employee exists ---
    const targetEmployee = employeeId
      ? await User.findById(employeeId)
      : await findAvailableEmployee(targetDepartment.trim());
    if (!targetEmployee || targetEmployee.role !== "Employee") {
      return sendControllerError(
        res,
        employeeId ? 400 : 409,
        employeeId
          ? "A valid Employee host is required"
          : "No employee is available in the target department",
      );
    }

    if (!targetEmployee.department || !targetEmployee.department.trim()) {
      return sendControllerError(
        res,
        400,
        "The selected Employee host must have a department",
      );
    }

    // Parse date-only input as a local calendar date, not UTC midnight.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
      return sendControllerError(
        res,
        400,
        "Visit date must use YYYY-MM-DD format",
      );
    }
    const [visitYear, visitMonth, visitDay] = visitDate.split("-").map(Number);
    const visitDateObj = new Date(visitYear, visitMonth - 1, visitDay);
    if (
      visitDateObj.getFullYear() !== visitYear ||
      visitDateObj.getMonth() !== visitMonth - 1 ||
      visitDateObj.getDate() !== visitDay
    ) {
      return sendControllerError(res, 400, "Visit date must be a valid date");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(expectedArrivalTime)) {
      return sendControllerError(
        res,
        400,
        "Expected arrival time must use HH:MM format",
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (visitDateObj < today) {
      return sendControllerError(res, 400, "Visit date cannot be in the past");
    }

    // --- Rule 4: If visit is today, expectedArrivalTime cannot be earlier than current time ---
    const isToday = visitDateObj.toDateString() === today.toDateString();
    if (isToday) {
      const now = new Date();
      const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM
      if (expectedArrivalTime < currentTimeStr) {
        return sendControllerError(
          res,
          400,
          `Expected arrival time cannot be earlier than current time (${currentTimeStr})`,
        );
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
    const activeStatuses = ["Pending", "Approved", "CheckedIn"];
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
          status: { $ne: "Cancelled" },
        },
      ],
    });

    if (existingVisit) {
      return sendControllerError(
        res,
        400,
        "Visitor already has an active visit or is already registered for this date",
      );
    }

    // --- Rule 5: Target employee cannot have more than 3 pending requests awaiting approval ---
    const pendingCount = employeeId
      ? await VisitRequest.countDocuments({
          employeeId,
          status: "Pending",
        })
      : 0;

    if (pendingCount >= 3) {
      return sendControllerError(
        res,
        400,
        "Target employee already has 3 pending visit requests awaiting approval",
      );
    }

    // --- Create the visit request ---
    const visitRequest = await VisitRequest.create({
      visitorId: visitor._id,
      employeeId: targetEmployee._id,
      assignedEmployee: targetEmployee._id,
      targetDepartment: targetEmployee.department,
      company,
      purpose,
      visitDate: visitDateObj,
      expectedArrivalTime,
      expectedEndTime: getExpectedEndTime(visitDateObj, expectedArrivalTime),
      passCode: generatePassCode(),
      status: "Pending",
    });

    // --- Log ActivityLog ('Created') ---
    await logActivity(visitRequest._id, "Created", req.user._id);
    await notifyVisitParties({
      visitRequest,
      visitor,
      host: targetEmployee,
      event: "created",
    });

    res.status(201).json({
      success: true,
      message: "Visitor registered and visit request created successfully",
      data: {
        visitRequest,
        visitor,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update visit request status (Approve/Reject)
// @route   PATCH /api/visitors/:id/status
// @access  Employee
const updateVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // Validate status
    if (!["Approved", "Rejected"].includes(status)) {
      return sendControllerError(
        res,
        400,
        "Status must be either Approved or Rejected",
      );
    }

    // Find the visit request
    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return sendControllerError(res, 404, "Visit request not found");
    }

    // Ensure the employee owns this visit request
    if (visitRequest.employeeId.toString() !== req.user._id.toString()) {
      return sendControllerError(
        res,
        403,
        "Access denied. You can only update your own visit requests.",
      );
    }

    // Update status and remarks
    if (visitRequest.status !== "Pending") {
      return sendControllerError(
        res,
        400,
        "Only pending visit requests can be approved or rejected",
      );
    }

    visitRequest.status = status;
    if (remarks) {
      visitRequest.remarks = remarks;
    }
    if (status === "Approved") {
      visitRequest.approvedBy = req.user._id;
      visitRequest.approvedAt = new Date();
    }
    await visitRequest.save();

    // --- Log ActivityLog ('Approved' or 'Rejected') ---
    await logActivity(visitRequest._id, status, req.user._id);

    if (status === "Approved") {
      const visitor = await Visitor.findById(visitRequest.visitorId).select(
        "name email phone",
      );
      await notifyVisitParties({
        visitRequest,
        visitor,
        host: req.user,
        event: "approved",
      });
    }

    res.json({
      success: true,
      message: `Visit request ${status.toLowerCase()} successfully`,
      data: visitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check in a visitor
// @route   PATCH /api/visitors/:id/check-in
// @access  Receptionist
const checkInVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the visit request
    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return sendControllerError(res, 404, "Visit request not found");
    }

    // --- Rule 6 & 9: Can only check in if status is 'Approved' (block if 'Rejected') ---
    if (visitRequest.status === "Rejected") {
      return sendControllerError(
        res,
        400,
        "Cannot check in a rejected visit request",
      );
    }

    // --- Rule 7: Block if already 'CheckedIn' ---
    if (visitRequest.status === "CheckedIn") {
      return sendControllerError(res, 400, "Visitor is already checked in");
    }

    if (visitRequest.status !== "Approved") {
      return sendControllerError(
        res,
        400,
        "Visit request must be Approved before check-in",
      );
    }

    const existingCheckedInVisit = await VisitRequest.findOne({
      visitorId: visitRequest.visitorId,
      status: "CheckedIn",
      _id: { $ne: visitRequest._id },
    });

    if (existingCheckedInVisit) {
      return sendControllerError(
        res,
        409,
        "Visitor already has another checked-in pass",
      );
    }

    if (!visitRequest.assignedEmployee) {
      const department = visitRequest.targetDepartment?.trim();
      const availableEmployee = await findAvailableEmployee(department);
      if (!availableEmployee) {
        return sendControllerError(
          res,
          409,
          "No employee is available in the target department",
        );
      }
      visitRequest.assignedEmployee = availableEmployee._id;
      visitRequest.employeeId = availableEmployee._id;
    }

    const session = await mongoose.startSession();
    let capacityMessage = "";
    try {
      await session.withTransaction(async () => {
        const { ongoingCount, queueCount } = await getEmployeeCapacity(
          visitRequest.assignedEmployee,
          session,
        );
        if (ongoingCount > 1 || queueCount > MAX_QUEUE_SIZE) {
          capacityMessage =
            "The assigned employee already exceeds meeting capacity";
          throw new Error("EMPLOYEE_CAPACITY_INVALID");
        }
        if (queueCount >= MAX_QUEUE_SIZE) {
          capacityMessage = "The assigned employee queue is full";
          throw new Error("EMPLOYEE_QUEUE_FULL");
        }

        visitRequest.meetingStatus =
          ongoingCount === 0 ? "ONGOING" : "IN_QUEUE";
        visitRequest.queuePosition =
          visitRequest.meetingStatus === "IN_QUEUE"
            ? queueCount + 1
            : undefined;
        if (!visitRequest.expectedEndTime) {
          visitRequest.expectedEndTime = getExpectedEndTime(
            visitRequest.visitDate,
            visitRequest.expectedArrivalTime,
          );
        }

        // Update status to CheckedIn and set checkInTime
        visitRequest.status = "CheckedIn";
        visitRequest.checkInTime = new Date();
        await visitRequest.save({ session });
      });
    } catch (error) {
      if (capacityMessage) {
        return sendControllerError(res, 409, capacityMessage);
      }
      throw error;
    } finally {
      await session.endSession();
    }

    // --- Log ActivityLog ('Checked In') ---
    await logActivity(visitRequest._id, "Checked In", req.user._id);

    const [visitor, host] = await Promise.all([
      Visitor.findById(visitRequest.visitorId).select("name email phone"),
      User.findById(visitRequest.employeeId).select("name email"),
    ]);
    await notifyVisitParties({
      visitRequest,
      visitor,
      host,
      event: "checkedIn",
    });

    res.json({
      success: true,
      message: "Visitor checked in successfully",
      data: visitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check out a visitor
// @route   PATCH /api/visitors/:id/check-out
// @access  Receptionist
const checkOutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the visit request
    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return sendControllerError(res, 404, "Visit request not found");
    }

    // Must be checked in first
    if (visitRequest.status !== "CheckedIn") {
      return sendControllerError(
        res,
        400,
        "Visitor must be checked in before check-out",
      );
    }

    // --- Rule 8: checkOutTime must be later than checkInTime ---
    const checkOutTime = new Date();
    if (checkOutTime <= visitRequest.checkInTime) {
      return sendControllerError(
        res,
        400,
        "Check-out time must be later than check-in time",
      );
    }

    const wasOngoing = visitRequest.meetingStatus === "ONGOING";

    // Update status to CheckedOut and set checkOutTime
    visitRequest.status = "CheckedOut";
    visitRequest.checkOutTime = checkOutTime;
    visitRequest.meetingStatus = "COMPLETED";
    visitRequest.queuePosition = undefined;
    await visitRequest.save();

    // --- Log ActivityLog ('Checked Out') ---
    await logActivity(visitRequest._id, "Checked Out", req.user._id);

    if (wasOngoing) {
      const promotedVisit = await promoteNextQueuedVisitor(
        visitRequest.assignedEmployee || visitRequest.employeeId,
      );
      if (promotedVisit) {
        await logActivity(promotedVisit._id, "Meeting Started", req.user._id);
      }
    }

    const [visitor, host] = await Promise.all([
      Visitor.findById(visitRequest.visitorId).select("name email phone"),
      User.findById(visitRequest.employeeId).select("name email"),
    ]);
    await notifyVisitParties({
      visitRequest,
      visitor,
      host,
      event: "checkedOut",
    });

    res.json({
      success: true,
      message: "Visitor checked out successfully",
      data: visitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extend an assigned meeting by up to 10 minutes
// @route   POST /api/visitors/:id/extend-time
// @access  Employee
const extendVisitTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const extensionMinutes = Number(
      req.body.extensionMinutes ?? req.body.additionalMinutes,
    );

    if (
      !Number.isInteger(extensionMinutes) ||
      extensionMinutes < 1 ||
      extensionMinutes > 10
    ) {
      return sendControllerError(
        res,
        400,
        "extensionMinutes must be a whole number between 1 and 10",
      );
    }

    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return sendControllerError(res, 404, "Visit request not found");
    }

    const assignedEmployeeId =
      visitRequest.assignedEmployee || visitRequest.employeeId;
    if (
      !assignedEmployeeId ||
      assignedEmployeeId.toString() !== req.user._id.toString()
    ) {
      return sendControllerError(
        res,
        403,
        "Only the assigned host employee can extend this meeting",
      );
    }

    if (
      visitRequest.meetingStatus === "COMPLETED" ||
      visitRequest.status !== "CheckedIn"
    ) {
      return sendControllerError(
        res,
        400,
        "Only an active checked-in meeting can be extended",
      );
    }

    const currentEndTime =
      visitRequest.expectedEndTime ||
      getExpectedEndTime(
        visitRequest.visitDate,
        visitRequest.expectedArrivalTime,
      );
    const totalExtendedMinutes = visitRequest.totalExtendedMinutes || 0;
    if (totalExtendedMinutes + extensionMinutes > 10) {
      return sendControllerError(
        res,
        400,
        "Maximum cumulative extension limit of 10 minutes reached.",
      );
    }
    visitRequest.expectedEndTime = new Date(
      currentEndTime.getTime() + extensionMinutes * 60 * 1000,
    );
    visitRequest.totalExtendedMinutes = totalExtendedMinutes + extensionMinutes;
    await visitRequest.save();
    await logActivity(
      visitRequest._id,
      `Time Extended (+${extensionMinutes} minutes)`,
      req.user._id,
    );

    res.json({
      success: true,
      message: "Meeting time extended successfully",
      data: visitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get each employee's ongoing meeting and waiting queue
// @route   GET /api/visitors/active-queues
// @access  Admin, Receptionist
const getActiveQueues = async (req, res, next) => {
  try {
    const employees = await User.find({ role: "Employee" })
      .select("name email department")
      .sort({ department: 1, name: 1 });
    const employeeIds = employees.map((employee) => employee._id);
    const activeVisits = await VisitRequest.find({
      assignedEmployee: { $in: employeeIds },
      meetingStatus: { $in: ["ONGOING", "IN_QUEUE"] },
    })
      .populate("visitorId", "name phone email govtId")
      .sort({ queuePosition: 1, createdAt: 1 });

    const visitsByEmployee = new Map(
      employeeIds.map((employeeId) => [employeeId.toString(), []]),
    );
    activeVisits.forEach((visit) => {
      const employeeVisits = visitsByEmployee.get(
        visit.assignedEmployee.toString(),
      );
      if (employeeVisits) employeeVisits.push(visit);
    });

    const data = employees.map((employee) => {
      const visits = visitsByEmployee.get(employee._id.toString()) || [];
      return {
        employee,
        ongoingMeeting:
          visits.find((visit) => visit.meetingStatus === "ONGOING") || null,
        queue: visits.filter((visit) => visit.meetingStatus === "IN_QUEUE"),
      };
    });

    res.json({
      success: true,
      message: "Active queues retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move a queued visitor to another employee
// @route   PUT /api/visitors/:id/reallot
// @access  Receptionist
const reallotVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return sendControllerError(
        res,
        400,
        "A destination employee is required",
      );
    }

    const [visitRequest, targetEmployee] = await Promise.all([
      VisitRequest.findById(id),
      User.findOne({ _id: employeeId, role: "Employee" }),
    ]);
    if (!visitRequest) {
      return sendControllerError(res, 404, "Visit request not found");
    }
    if (!targetEmployee) {
      return sendControllerError(
        res,
        400,
        "A valid destination employee is required",
      );
    }
    if (visitRequest.meetingStatus !== "IN_QUEUE") {
      return sendControllerError(
        res,
        400,
        "Only visitors currently in a queue can be re-assigned",
      );
    }
    if (
      visitRequest.assignedEmployee?.toString() ===
      targetEmployee._id.toString()
    ) {
      return sendControllerError(
        res,
        400,
        "Visitor is already assigned to this employee",
      );
    }

    const sourceEmployeeId = visitRequest.assignedEmployee;
    const sourceQueuePosition = visitRequest.queuePosition;
    const session = await mongoose.startSession();
    let capacityMessage = "";
    try {
      await session.withTransaction(async () => {
        const { ongoingCount, queueCount } = await getEmployeeCapacity(
          targetEmployee._id,
          session,
        );
        if (ongoingCount > 1 || queueCount > MAX_QUEUE_SIZE) {
          capacityMessage =
            "The destination employee already exceeds meeting capacity";
          throw new Error("EMPLOYEE_CAPACITY_INVALID");
        }
        if (queueCount >= MAX_QUEUE_SIZE) {
          capacityMessage = "The destination employee queue is full";
          throw new Error("EMPLOYEE_QUEUE_FULL");
        }

        visitRequest.assignedEmployee = targetEmployee._id;
        visitRequest.employeeId = targetEmployee._id;
        visitRequest.targetDepartment = targetEmployee.department;
        visitRequest.queuePosition = queueCount + 1;
        await visitRequest.save({ session });

        if (sourceEmployeeId && sourceQueuePosition) {
          await VisitRequest.updateMany(
            {
              assignedEmployee: sourceEmployeeId,
              meetingStatus: "IN_QUEUE",
              queuePosition: { $gt: sourceQueuePosition },
            },
            { $inc: { queuePosition: -1 } },
            { session },
          );
        }
      });
    } catch (error) {
      if (capacityMessage) {
        return sendControllerError(res, 409, capacityMessage);
      }
      throw error;
    } finally {
      await session.endSession();
    }

    await logActivity(
      visitRequest._id,
      `Host Re-assigned to ${targetEmployee.name}`,
      req.user._id,
    );

    res.json({
      success: true,
      message: "Visitor host re-assigned successfully",
      data: visitRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending visit requests for the logged-in employee
// @route   GET /api/visitors/pending
// @access  Employee
const getPendingVisits = async (req, res, next) => {
  try {
    const pendingVisits = await VisitRequest.find({
      employeeId: req.user._id,
      status: "Pending",
    })
      .populate("visitorId", "name phone email govtId")
      .populate("employeeId", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Pending visits retrieved successfully",
      count: pendingVisits.length,
      data: pendingVisits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active visits
// @route   GET /api/visitors/active
// @access  Protected (any authenticated user)
const getActiveVisits = async (req, res, next) => {
  try {
    const activeStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "CheckedIn",
      "CheckedOut",
    ];
    const { startDate, endDate, status, department, search } = req.query;
    const match = { status: { $in: activeStatuses } };

    if (status && status !== "All") {
      if (!activeStatuses.includes(status)) {
        return sendControllerError(res, 400, "Invalid visit status filter");
      }
      match.status = status;
    }

    if (startDate || endDate) {
      match.visitDate = {};
      if (startDate) {
        const parsedStartDate = new Date(`${startDate}T00:00:00.000`);
        if (Number.isNaN(parsedStartDate.getTime())) {
          return sendControllerError(res, 400, "Invalid startDate filter");
        }
        match.visitDate.$gte = parsedStartDate;
      }
      if (endDate) {
        const parsedEndDate = new Date(`${endDate}T23:59:59.999`);
        if (Number.isNaN(parsedEndDate.getTime())) {
          return sendControllerError(res, 400, "Invalid endDate filter");
        }
        match.visitDate.$lte = parsedEndDate;
      }
    }

    if (department && department !== "All") {
      const employeeIds = await User.find({ department }).distinct("_id");
      match.employeeId = { $in: employeeIds };
    }

    if (search?.trim()) {
      const searchPattern = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      const [visitorIds, employeeIds] = await Promise.all([
        Visitor.find({ name: searchPattern }).distinct("_id"),
        User.find({ name: searchPattern }).distinct("_id"),
      ]);
      match.$or = [
        { visitorId: { $in: visitorIds } },
        { employeeId: { $in: employeeIds } },
      ];
    }

    const activeVisits = await VisitRequest.find(match)
      .populate("visitorId", "name phone email govtId")
      .populate("employeeId", "name email department")
      .populate("approvedBy", "name email")
      .sort({ visitDate: 1, expectedArrivalTime: 1 });

    res.json({
      success: true,
      message: "Active visits retrieved successfully",
      count: activeVisits.length,
      data: activeVisits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply a batch action to visit requests
// @route   POST /api/visitors/bulk-action
// @access  Employee (approve) or Receptionist (check out)
const bulkVisitorAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendControllerError(
        res,
        400,
        "At least one visit request ID is required",
      );
    }

    if (!["approve", "checkOut"].includes(action)) {
      return sendControllerError(
        res,
        400,
        "Action must be approve or checkOut",
      );
    }

    if (action === "approve" && req.user.role !== "Employee") {
      return sendControllerError(
        res,
        403,
        "Only Employees can bulk approve visit requests",
      );
    }

    if (action === "checkOut" && req.user.role !== "Receptionist") {
      return sendControllerError(
        res,
        403,
        "Only Receptionists can bulk check out visitors",
      );
    }

    const filter = {
      _id: { $in: ids },
      status: action === "approve" ? "Pending" : "CheckedIn",
    };

    if (action === "approve") {
      filter.employeeId = req.user._id;
    }

    const update =
      action === "approve"
        ? { $set: { status: "Approved" } }
        : {
            $set: {
              status: "CheckedOut",
              checkOutTime: new Date(),
              meetingStatus: "COMPLETED",
            },
            $unset: { queuePosition: 1 },
          };

    const eligibleVisits = await VisitRequest.find(filter)
      .select(
        "_id visitorId employeeId assignedEmployee passCode visitDate expectedArrivalTime status",
      )
      .populate("visitorId", "name email phone")
      .populate("employeeId", "name email");
    const result = await VisitRequest.updateMany(filter, update);

    if (eligibleVisits.length > 0) {
      await ActivityLog.insertMany(
        eligibleVisits.map(({ _id }) => ({
          visitRequestId: _id,
          action: action === "approve" ? "Approved" : "Checked Out",
          performedBy: req.user._id,
        })),
      );

      if (action === "approve") {
        await Promise.all(
          eligibleVisits.map((visitRequest) => {
            visitRequest.status = "Approved";
            return notifyVisitParties({
              visitRequest,
              visitor: visitRequest.visitorId,
              host: visitRequest.employeeId,
              event: "approved",
            });
          }),
        );
      } else {
        const employeeIds = new Set(
          eligibleVisits
            .map(
              (visitRequest) =>
                visitRequest.assignedEmployee || visitRequest.employeeId,
            )
            .filter(Boolean)
            .map((employeeId) => employeeId.toString()),
        );
        await Promise.all(
          [...employeeIds].map((employeeId) =>
            promoteNextQueuedVisitor(employeeId),
          ),
        );

        await Promise.all(
          eligibleVisits.map((visitRequest) => {
            visitRequest.status = "CheckedOut";
            return notifyVisitParties({
              visitRequest,
              visitor: visitRequest.visitorId,
              host: visitRequest.employeeId,
              event: "checkedOut",
            });
          }),
        );
      }
    }

    res.json({
      success: true,
      message:
        action === "approve"
          ? "Visit requests approved successfully"
          : "Visitors checked out successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
