const mongoose = require("mongoose");

const fleetMapSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    driver: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    speedKmh: { type: Number, default: 0 },
    distanceTraveledKm: { type: Number, default: 0 },
    heading: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FleetMap", fleetMapSchema);
