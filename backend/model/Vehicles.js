const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    status: { type: String, required: true, trim: true },
    assignedDriver: { type: String, required: true, trim: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
