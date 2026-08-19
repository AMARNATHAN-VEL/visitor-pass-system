const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    govtId: {
      type: String,
      required: [true, "Government ID is required"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ email: 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
