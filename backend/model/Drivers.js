const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    joinDate: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
