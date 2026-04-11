const mongoose = require('mongoose');
const RecycleBin = require('../model/RecycleBin');
const Inventory = require('../model/Inventory');
const Vehicle = require('../model/Vehicles');
const Driver = require('../model/Drivers');
const Trip = require('../model/Trips');
const Fuel = require('../model/fuel');
const Maintenance = require('../model/Maintenance');

const entityModelMap = {
  Inventory,
  Vehicle,
  Driver,
  Trip,
  Fuel,
  Maintenance
};

const archiveRecord = async ({ type, document, deletedBy = 'system', meta = {} }) => {
  if (!document) {
    throw new Error('Document is required for recycle bin archive');
  }

  const payload = typeof document.toObject === 'function' ? document.toObject({ depopulate: true }) : { ...document };
  const rawId = payload._id || payload.id;
  const normalizedOriginalId = mongoose.Types.ObjectId.isValid(rawId) ? mongoose.Types.ObjectId(rawId) : null;

  if (!normalizedOriginalId) {
    throw new Error('Document is missing a valid identifier');
  }

  const entry = new RecycleBin({
    type,
    originalId: normalizedOriginalId,
    data: payload,
    deletedAt: new Date(),
    deletedBy,
    meta
  });

  return entry.save();
};

const getModelForType = (type) => entityModelMap[type] || null;

module.exports = {
  RecycleBin,
  archiveRecord,
  getModelForType,
  entityModelMap
};
