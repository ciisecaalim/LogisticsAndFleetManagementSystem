const mongoose = require("mongoose");

const SHIPMENT_STATUS_OPTIONS = ["Pending", "Assigned", "In Transit", "Delivered"];

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      trim: true,
      unique: true,
      default: () => `SHP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    destination: { type: String, required: true, trim: true },
    status: {
      type: String,
      trim: true,
      enum: SHIPMENT_STATUS_OPTIONS,
      default: "Pending"
    },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    tripLabel: { type: String, trim: true, default: "" },
    vehicle: { type: String, trim: true, default: "" },
    driver: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
