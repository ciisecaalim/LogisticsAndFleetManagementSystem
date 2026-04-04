const mongoose = require("mongoose");
const Trip = require("../model/Trips");
const Vehicle = require("../model/Vehicles");
const Driver = require("../model/Drivers");

const toTitleCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
};

const hashCoordinate = (label = "", axis = "lat") => {
  const normalized = String(label || "unknown").toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) % 10000;
  }

  if (axis === "lat") {
    return 39.5 + (hash % 1800) / 1000;
  }

  return -75 + (hash % 1800) / 1000;
};

const buildLocation = (input, fallbackLabel) => {
  if (input && typeof input === "object") {
    const label = String(input.label || fallbackLabel || "").trim();
    return {
      label,
      lat: Number(input.lat ?? hashCoordinate(label, "lat")),
      lng: Number(input.lng ?? hashCoordinate(label, "lng"))
    };
  }

  const label = String(input || fallbackLabel || "").trim();
  return {
    label,
    lat: hashCoordinate(label, "lat"),
    lng: hashCoordinate(label, "lng")
  };
};

const normalizeTripStatus = (status) => {
  const normalized = String(status || "Pending").trim().toLowerCase();
  if (normalized === "completed") {
    return "Completed";
  }
  if (normalized === "ongoing" || normalized === "assigned" || normalized === "in-progress") {
    return "Ongoing";
  }
  return "Pending";
};

const createExpectedArrival = (departureTime, distanceKm) => {
  const departure = new Date(departureTime || Date.now());
  const speedKmPerHour = 60;
  const durationHours = Math.max(1, Number(distanceKm || 0) / speedKmPerHour);
  return new Date(departure.getTime() + durationHours * 60 * 60 * 1000);
};

const normalizeTripPayload = (payload = {}) => {
  const body = { ...payload };

  const from = String(body.from || body.startLocation?.label || "").trim();
  const to = String(body.to || body.destination?.label || "").trim();

  const startLocation = buildLocation(body.startLocation || from, from);
  const destination = buildLocation(body.destination || to, to);
  const departureTime = new Date(body.departureTime || body.date || Date.now());
  const expectedArrivalTime = new Date(body.expectedArrivalTime || createExpectedArrival(departureTime, body.distance));

  body.from = from;
  body.to = to;
  body.startLocation = startLocation;
  body.destination = destination;
  body.departureTime = Number.isNaN(departureTime.getTime()) ? new Date() : departureTime;
  body.expectedArrivalTime = Number.isNaN(expectedArrivalTime.getTime())
    ? createExpectedArrival(body.departureTime, body.distance)
    : expectedArrivalTime;
  body.status = normalizeTripStatus(body.status);
  body.distance = Number(body.distance || 0);
  body.progressPercent = Number(body.progressPercent || 0);
  body.date = String(body.date || new Date().toISOString().slice(0, 10)).slice(0, 10);

  return body;
};

const findVehicleByInput = async (input) => {
  const token = String(input || "").trim();
  if (!token) {
    return null;
  }

  const queries = [];

  if (mongoose.Types.ObjectId.isValid(token)) {
    queries.push({ _id: token });
  }

  queries.push({ vehicleId: token }, { plateNumber: token }, { trackerId: token });

  for (const query of queries) {
    const vehicle = await Vehicle.findOne(query);
    if (vehicle) {
      return vehicle;
    }
  }

  return null;
};

const findDriverByInput = async (input) => {
  const token = String(input || "").trim();
  if (!token) {
    return null;
  }

  const queries = [];

  if (mongoose.Types.ObjectId.isValid(token)) {
    queries.push({ _id: token });
  }

  queries.push({ driverId: token }, { name: token }, { email: token }, { phone: token });

  for (const query of queries) {
    const driver = await Driver.findOne(query);
    if (driver) {
      return driver;
    }
  }

  return null;
};

const syncTripAssignment = async (tripPayload) => {
  const [vehicle, driver] = await Promise.all([
    findVehicleByInput(tripPayload.vehicleId || tripPayload.vehicle),
    findDriverByInput(tripPayload.driverId || tripPayload.driver)
  ]);

  if (vehicle) {
    tripPayload.vehicleId = vehicle.vehicleId || String(vehicle._id);
    tripPayload.vehicle = vehicle.plateNumber;

    vehicle.assignedDriver = driver ? driver.name : tripPayload.driver;
    vehicle.assignedDriverId = driver ? (driver.driverId || String(driver._id)) : tripPayload.driverId || "";
    vehicle.status = tripPayload.status === "Completed" ? "Available" : "Assigned";
    vehicle.destination = {
      label: tripPayload.destination.label,
      lat: tripPayload.destination.lat,
      lng: tripPayload.destination.lng
    };
    await vehicle.save();
  }

  if (driver) {
    tripPayload.driverId = driver.driverId || String(driver._id);
    tripPayload.driver = driver.name;
    driver.status = tripPayload.status === "Completed" ? "Available" : "Assigned";
    await driver.save();
  } else {
    tripPayload.driver = toTitleCase(tripPayload.driver);
  }

  return tripPayload;
};

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

    const payload = normalizeTripPayload(req.body);
    const syncedPayload = await syncTripAssignment(payload);
    const updated = await Trip.findOneAndUpdate(query, syncedPayload, { new: true });

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
    const payload = normalizeTripPayload(req.body);
    const syncedPayload = await syncTripAssignment(payload);
    const newdata = new Trip(syncedPayload);
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

    const [vehicle, driver] = await Promise.all([
      findVehicleByInput(dl.vehicleId || dl.vehicle),
      findDriverByInput(dl.driverId || dl.driver)
    ]);

    if (vehicle) {
      vehicle.assignedDriver = "Unassigned";
      vehicle.assignedDriverId = "";
      vehicle.status = "Available";
      await vehicle.save();
    }

    if (driver) {
      driver.status = "Available";
      await driver.save();
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
