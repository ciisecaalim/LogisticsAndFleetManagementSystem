const mongoose = require('mongoose');

const RecycleBinSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  deletedAt: {
    type: Date,
    default: () => new Date()
  },
  deletedBy: {
    type: String,
    default: 'system'
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('RecycleBin', RecycleBinSchema);
