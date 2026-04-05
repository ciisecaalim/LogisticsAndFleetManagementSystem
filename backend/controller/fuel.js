const mongoose = require("mongoose");
const Fuel = require("../model/fuel");
const { archiveRecord } = require("../services/recycleBinService");
const { getDeletedByValue } = require("../utils/deletionContext");

const buildFuelQuery = (paramId) => {
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
  const query = buildFuelQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid fuel id" });
  }

  try {
    const reads = await Fuel.findOne(query);

    if (!reads) {
      return res.status(404).json({ message: "Fuel record not found" });
    }

    res.status(200).json({
      message: "Read fuel record successfully!",
      data: reads
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading fuel record",
      error: error.message
    });
  }
};

// ✅ UPDATE
const fuelUpdate = async (req, res) => {
  try {
    const query = buildFuelQuery(req.params.id);

    if (!query) {
      return res.status(400).json({ message: "Invalid fuel id" });
    }

    const updated = await Fuel.findOneAndUpdate(query, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Fuel record not found" });
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
const createFuel = async (req, res) => {
  try {
    const newdata = new Fuel({ ...req.body });
    const savedata = await newdata.save();

    res.status(200).json({
      message: "Fuel record created successfully!",
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
    const findAll = await Fuel.find();

    res.status(200).json({
      message: "All fuel records",
      data: findAll
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading all fuel records",
      error: error.message
    });
  }
};

// ✅ DELETE
const deleteFuel = async (req, res) => {
  const query = buildFuelQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid fuel id" });
  }

  try {
    const record = await Fuel.findOne(query);

    if (!record) {
      return res.status(404).json({ message: "Fuel record not found" });
    }

    await archiveRecord({
      type: "Fuel",
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
      message: "Error deleting fuel record",
      error: error.message
    });
  }
};

module.exports = { createFuel, readAll, deleteFuel, readSingle, fuelUpdate };
