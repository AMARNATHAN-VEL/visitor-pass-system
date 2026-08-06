const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    visitRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VisitRequest',
      required: [true, 'Visit request reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by user reference is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);