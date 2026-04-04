const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      trim: true,
      unique: true,
      default: () => `VH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    },
    plateNumber: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    trackerId: {
      type: String,
      trim: true,
      unique: true,
      default: () => `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    },
    brand: { type: String, default: '', trim: true },
    type: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    status: { type: String, required: true, trim: true },
    assignedDriver: { type: String, default: 'Unassigned', trim: true },
    assignedDriverId: { type: String, default: '', trim: true },
    gps: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      lastUpdate: { type: Date, default: Date.now }
    },
    currentLocation: {
      label: { type: String, default: '', trim: true },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    destination: {
      label: { type: String, default: '', trim: true },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
