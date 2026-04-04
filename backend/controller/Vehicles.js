const mongoose = require("mongoose");
const Vehicle = require("../model/Vehicles");

const normalizeVehiclePayload = (payload = {}) => {
  const body = { ...payload };

  const gpsSource = body.gps && typeof body.gps === "object" ? body.gps : {};
  const lat = Number(gpsSource.lat ?? body.lat ?? 0);
  const lng = Number(gpsSource.lng ?? body.lng ?? 0);
  const lastUpdate = gpsSource.lastUpdate || body.lastUpdate || new Date();

  body.gps = {
    lat,
    lng,
    lastUpdate
  };

  body.lat = lat;
  body.lng = lng;
  body.lastUpdate = lastUpdate;

  return body;
};

const buildVehicleQuery = (paramId) => {
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
  const query = buildVehicleQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid vehicle id" });
  }

  try {
    const reads = await Vehicle.findOne(query);

    if (!reads) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Read vehicle successfully!",
      data: reads
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading vehicle",
      error: error.message
    });
  }
};

// ✅ UPDATE
const vehicleUpdate = async (req, res) => {
  try {
    const query = buildVehicleQuery(req.params.id);

    if (!query) {
      return res.status(400).json({ message: "Invalid vehicle id" });
    }

    const updated = await Vehicle.findOneAndUpdate(query, normalizeVehiclePayload(req.body), { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Vehicle not found" });
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
const createVehicle = async (req, res) => {
  try {
    const newdata = new Vehicle(normalizeVehiclePayload(req.body));
    const savedata = await newdata.save();

    res.status(200).json({
      message: "Vehicle created successfully!",
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
    const findAll = await Vehicle.find();

    res.status(200).json({
      message: "All vehicles",
      data: findAll
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading all vehicles",
      error: error.message
    });
  }
};

// ✅ DELETE
const deleteVehicle = async (req, res) => {
  const query = buildVehicleQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid vehicle id" });
  }

  try {
    const dl = await Vehicle.findOneAndDelete(query);

    if (!dl) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Deleted successfully",
      data: dl
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting vehicle",
      error: error.message
    });
  }
};

module.exports = { createVehicle, readAll, deleteVehicle, readSingle, vehicleUpdate };
