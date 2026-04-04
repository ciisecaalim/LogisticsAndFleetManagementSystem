const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    brand: { type: String, default: '', trim: true },
    type: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    status: { type: String, required: true, trim: true },
    assignedDriver: { type: String, default: 'Unassigned', trim: true },
    gps: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      lastUpdate: { type: Date, default: Date.now }
    },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
