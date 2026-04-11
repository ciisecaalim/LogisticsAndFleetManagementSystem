const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: String,
      trim: true,
      unique: true,
      default: () => `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0 },
    image: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
