const mongoose = require("mongoose");
const Driver = require("../model/Drivers");

const buildDriverQuery = (paramId) => {
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
  const query = buildDriverQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid driver id" });
  }

  try {
    const reads = await Driver.findOne(query);

    if (!reads) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.status(200).json({
      message: "Read driver successfully!",
      data: reads
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading driver",
      error: error.message
    });
  }
};

// ✅ UPDATE
const driverUpdate = async (req, res) => {
  try {
    const query = buildDriverQuery(req.params.id);

    if (!query) {
      return res.status(400).json({ message: "Invalid driver id" });
    }

    const updated = await Driver.findOneAndUpdate(query, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Driver not found" });
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
const createDriver = async (req, res) => {
  try {
    const newdata = new Driver({ ...req.body });
    const savedata = await newdata.save();

    res.status(200).json({
      message: "Driver created successfully!",
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
    const findAll = await Driver.find();

    res.status(200).json({
      message: "All drivers",
      data: findAll
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading all drivers",
      error: error.message
    });
  }
};

// ✅ DELETE
const deleteDriver = async (req, res) => {
  const query = buildDriverQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid driver id" });
  }

  try {
    const dl = await Driver.findOneAndDelete(query);

    if (!dl) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.status(200).json({
      message: "Deleted successfully",
      data: dl
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting driver",
      error: error.message
    });
  }
};

module.exports = { createDriver, readAll, deleteDriver, readSingle, driverUpdate };
