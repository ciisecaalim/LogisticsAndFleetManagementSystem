const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      trim: true,
      unique: true,
      default: () => `TRP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    },
    vehicleId: { type: String, default: '', trim: true },
    vehicle: { type: String, required: true, trim: true },
    driverId: { type: String, default: '', trim: true },
    driver: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    startLocation: {
      label: { type: String, default: '', trim: true },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    destination: {
      label: { type: String, default: '', trim: true },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    departureTime: { type: Date, default: Date.now },
    expectedArrivalTime: { type: Date, default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) },
    actualArrivalTime: { type: Date },
    distance: { type: Number, required: true },
    progressPercent: { type: Number, default: 0 },
    routeDeviationAlerted: { type: Boolean, default: false },
    destinationReachedAlerted: { type: Boolean, default: false },
    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
