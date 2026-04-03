const mongoose = require("mongoose");

const fuelSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, trim: true },
    vehicle: { type: String, required: true, trim: true },
    liters: { type: Number, required: true },
    cost: { type: Number, required: true },
    pricePerLiter: { type: Number, required: true },
    station: { type: String, required: true, trim: true },
    odometer: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fuel", fuelSchema);
