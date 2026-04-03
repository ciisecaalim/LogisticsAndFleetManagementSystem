const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    vehicle: { type: String, required: true, trim: true },
    driver: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    distance: { type: Number, required: true },
    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
