const mongoose = require('mongoose');
const Warehousing = require('../model/Warehousing');

const buildWarehousingQuery = (paramId) => {
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

const normalizeWarehousingPayload = (payload = {}) => ({
  zoneName: String(payload.zoneName || '').trim(),
  managerName: String(payload.managerName || '').trim(),
  progress: Number(payload.progress || 0),
  zoneType: String(payload.zoneType || '').trim(),
  activityType: String(payload.activityType || '').trim(),
  timestamp: String(payload.timestamp || '').trim(),
  status: String(payload.status || 'Scheduled').trim()
});

const createWarehousing = async (req, res) => {
  try {
    const created = await Warehousing.create(normalizeWarehousingPayload(req.body));

    res.status(201).json({
      message: 'Warehousing record created successfully',
      data: created
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating warehousing record',
      error: error.message
    });
  }
};

const readAll = async (req, res) => {
  try {
    const items = await Warehousing.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Warehousing records',
      data: items
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error reading warehousing records',
      error: error.message
    });
  }
};

const readSingle = async (req, res) => {
  const query = buildWarehousingQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: 'Invalid warehousing id' });
  }

  try {
    const item = await Warehousing.findOne(query);

    if (!item) {
      return res.status(404).json({ message: 'Warehousing record not found' });
    }

    res.status(200).json({
      message: 'Warehousing record',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error reading warehousing record',
      error: error.message
    });
  }
};

const updateWarehousing = async (req, res) => {
  const query = buildWarehousingQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: 'Invalid warehousing id' });
  }

  try {
    const updated = await Warehousing.findOneAndUpdate(query, normalizeWarehousingPayload(req.body), { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Warehousing record not found' });
    }

    res.status(200).json({
      message: 'Warehousing record updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating warehousing record',
      error: error.message
    });
  }
};

const deleteWarehousing = async (req, res) => {
  const query = buildWarehousingQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: 'Invalid warehousing id' });
  }

  try {
    const item = await Warehousing.findOne(query);

    if (!item) {
      return res.status(404).json({ message: 'Warehousing record not found' });
    }

    await item.deleteOne();

    res.status(200).json({
      message: 'Warehousing record deleted successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting warehousing record',
      error: error.message
    });
  }
};

module.exports = {
  createWarehousing,
  readAll,
  readSingle,
  updateWarehousing,
  deleteWarehousing
};