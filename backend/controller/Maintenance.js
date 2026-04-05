const mongoose = require("mongoose");
const Maintenance = require("../model/Maintenance");
const { archiveRecord } = require("../services/recycleBinService");
const { getDeletedByValue } = require("../utils/deletionContext");

const buildMaintenanceQuery = (paramId) => {
  if (paramId === undefined || paramId === null) {
    return null;
  }

  const idAsString = String(paramId).trim();
  if (!idAsString || idAsString === "null" || idAsString === "undefined") {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(idAsString)) {
    return { _id: idAsString };
  }

  return null;
};

// ✅ READ SINGLE
const readSingle = async (req, res) => {
  const query = buildMaintenanceQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid maintenance id" });
  }

  try {
    const reads = await Maintenance.findOne(query);

    if (!reads) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    res.status(200).json({
      message: "Read maintenance record successfully!",
      data: reads
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading maintenance record",
      error: error.message
    });
  }
};

// ✅ UPDATE
const maintenanceUpdate = async (req, res) => {
  try {
    const query = buildMaintenanceQuery(req.params.id);

    if (!query) {
      return res.status(400).json({ message: "Invalid maintenance id" });
    }

    const updated = await Maintenance.findOneAndUpdate(query, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    res.status(200).json({
      message: "Updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ CREATE
const createMaintenance = async (req, res) => {
  try {
    const newdata = new Maintenance({ ...req.body });
    const savedata = await newdata.save();

    res.status(200).json({
      message: "Maintenance record created successfully!",
      data: savedata
    });
  } catch (error) {
    res.status(500).json({
      message: "Error occurred",
      error: error.message
    });
  }
};

// ✅ READ ALL
const readAll = async (req, res) => {
  try {
    const findAll = await Maintenance.find();

    res.status(200).json({
      message: "All maintenance records",
      data: findAll
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading all maintenance records",
      error: error.message
    });
  }
};

// ✅ DELETE
const deleteMaintenance = async (req, res) => {
  const query = buildMaintenanceQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid maintenance id" });
  }

  try {
    const record = await Maintenance.findOne(query);

    if (!record) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    await archiveRecord({
      type: "Maintenance",
      document: record,
      deletedBy: getDeletedByValue(req)
    });

    await record.deleteOne();

    res.status(200).json({
      message: "Deleted successfully",
      data: record
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting maintenance record",
      error: error.message
    });
  }
};

module.exports = { createMaintenance, readAll, deleteMaintenance, readSingle, maintenanceUpdate };
