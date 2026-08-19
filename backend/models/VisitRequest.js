const mongoose = require("mongoose");

const visitRequestSchema = new mongoose.Schema(
  {
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      required: [true, "Visitor reference is required"],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      trim: true,
    },
    visitDate: {
      type: Date,
      required: [true, "Visit date is required"],
    },
    expectedArrivalTime: {
      type: String,
      required: [true, "Expected arrival time is required"],
      trim: true,
    },
    passCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "CheckedIn",
        "CheckedOut",
        "Cancelled",
      ],
      default: "Pending",
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

visitRequestSchema.index({ status: 1 });
visitRequestSchema.index({ createdAt: -1 });
visitRequestSchema.index({ visitDate: 1 });
visitRequestSchema.index({ visitDate: 1, status: 1 });
visitRequestSchema.index({ visitorId: 1, status: 1 });
visitRequestSchema.index({ employeeId: 1, status: 1, createdAt: -1 });
visitRequestSchema.index(
  { visitorId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "CheckedIn" },
    name: "one_checked_in_visit_per_visitor",
  },
);

module.exports = mongoose.model("VisitRequest", visitRequestSchema);
