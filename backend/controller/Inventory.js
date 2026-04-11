const mongoose = require('mongoose');
const Inventory = require('../model/Inventory');
const { archiveRecord } = require('../services/recycleBinService');
const { getDeletedByValue } = require('../utils/deletionContext');

const buildInventoryQuery = (paramId) => {
  if (paramId === undefined || paramId === null) {
    return null;
  }

  const idAsString = String(paramId).trim();
  if (!idAsString || idAsString === 'null' || idAsString === 'undefined') {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(idAsString)) {
    return { _id: idAsString };
  }

  return null;
};

const normalizeInventoryPayload = (payload = {}) => ({
  name: String(payload.name || '').trim(),
  sku: String(payload.sku || '').trim(),
  category: String(payload.category || '').trim(),
  quantity: Number(payload.quantity || 0),
  image: String(payload.image || '').trim()
});

const createInventory = async (req, res) => {
  try {
    const created = await Inventory.create(normalizeInventoryPayload(req.body));

    res.status(201).json({
      message: 'Inventory item created successfully',
      data: created
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating inventory item',
      error: error.message
    });
  }
};

const readAll = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Inventory items',
      data: items
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error reading inventory items',
      error: error.message
    });
  }
};

const readSingle = async (req, res) => {
  const query = buildInventoryQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: 'Invalid inventory id' });
  }

  try {
    const item = await Inventory.findOne(query);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({
      message: 'Inventory item',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error reading inventory item',
      error: error.message
    });
  }
};

const updateInventory = async (req, res) => {
  const query = buildInventoryQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: 'Invalid inventory id' });
  }

  try {
    const updated = await Inventory.findOneAndUpdate(query, normalizeInventoryPayload(req.body), { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({
      message: 'Inventory item updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating inventory item',
      error: error.message
    });
  }
};

const deleteInventory = async (req, res) => {
  const query = buildInventoryQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: 'Invalid inventory id' });
  }

  try {
    const item = await Inventory.findOne(query);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await archiveRecord({
      type: 'Inventory',
      document: item,
      deletedBy: getDeletedByValue(req)
    });

    await item.deleteOne();

    res.status(200).json({
      message: 'Inventory item deleted successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
};

module.exports = {
  createInventory,
  readAll,
  readSingle,
  updateInventory,
  deleteInventory
};
