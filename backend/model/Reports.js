const mongoose = require("mongoose");

const reportsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportsSchema);
