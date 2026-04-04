const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      trim: true,
      unique: true,
      default: () => `DRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    contactInfo: {
      phone: { type: String, default: '', trim: true },
      email: { type: String, default: '', trim: true }
    },
    licenseNumber: { type: String, required: true, trim: true },
    joinDate: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
