const mongoose = require("mongoose");
const Trip = require("../model/Trips");

const buildTripQuery = (paramId) => {
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
  const query = buildTripQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid trip id" });
  }

  try {
    const reads = await Trip.findOne(query);

    if (!reads) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.status(200).json({
      message: "Read trip successfully!",
      data: reads
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading trip",
      error: error.message
    });
  }
};

// ✅ UPDATE
const tripUpdate = async (req, res) => {
  try {
    const query = buildTripQuery(req.params.id);

    if (!query) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const updated = await Trip.findOneAndUpdate(query, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Trip not found" });
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
const createTrip = async (req, res) => {
  try {
    const newdata = new Trip({ ...req.body });
    const savedata = await newdata.save();

    res.status(200).json({
      message: "Trip created successfully!",
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
    const findAll = await Trip.find();

    res.status(200).json({
      message: "All trips",
      data: findAll
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading all trips",
      error: error.message
    });
  }
};

// ✅ DELETE
const deleteTrip = async (req, res) => {
  const query = buildTripQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid trip id" });
  }

  try {
    const dl = await Trip.findOneAndDelete(query);

    if (!dl) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.status(200).json({
      message: "Deleted successfully",
      data: dl
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting trip",
      error: error.message
    });
  }
};

module.exports = { createTrip, readAll, deleteTrip, readSingle, tripUpdate };
