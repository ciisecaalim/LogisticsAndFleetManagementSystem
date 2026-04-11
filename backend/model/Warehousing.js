const mongoose = require('mongoose');

const warehousingSchema = new mongoose.Schema(
  {
    zoneName: { type: String, required: true, trim: true },
    managerName: { type: String, required: true, trim: true },
    progress: { type: Number, required: true, default: 0 },
    zoneType: { type: String, required: true, trim: true },
    activityType: { type: String, required: true, trim: true },
    timestamp: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehousing', warehousingSchema);