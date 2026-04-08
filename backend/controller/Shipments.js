const mongoose = require("mongoose");
const Shipment = require("../model/Shipment");
const Trip = require("../model/Trips");

const SHIPMENT_STATUS_OPTIONS = ["Pending", "Assigned", "In Transit", "Delivered"];

const buildShipmentQuery = (paramId) => {
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

  if (/^SHP-/.test(idAsString)) {
    return { shipmentId: idAsString };
  }

  return null;
};

const normalizeShipmentPayload = (payload = {}) => {
  const body = { ...payload };
  body.productName = String(body.productName || "").trim();
  body.destination = String(body.destination || "").trim();
  body.notes = String(body.notes || "").trim();
  body.quantity = Number.isNaN(Number(body.quantity)) ? 0 : Number(body.quantity);

  const status = String(body.status || "").trim();
  body.status = SHIPMENT_STATUS_OPTIONS.includes(status) ? status : "Pending";

  if (body.tripId && mongoose.Types.ObjectId.isValid(body.tripId)) {
    body.tripId = mongoose.Types.ObjectId(body.tripId);
  } else {
    body.tripId = null;
  }

  return body;
};

const attachTripDetails = async (payload) => {
  if (!payload.tripId) {
    payload.tripLabel = "";
    payload.vehicle = payload.vehicle || "";
    payload.driver = payload.driver || "";
    return payload;
  }

  const trip = await Trip.findOne({ _id: payload.tripId });
  if (!trip) {
    payload.tripLabel = "";
    payload.vehicle = payload.vehicle || "";
    payload.driver = payload.driver || "";
    payload.tripId = null;
    return payload;
  }

  payload.tripLabel = trip.tripId || `${trip.vehicle} • ${trip.from} → ${trip.to}`;
  payload.vehicle = trip.vehicle || "";
  payload.driver = trip.driver || "";
  payload.tripId = trip._id;
  return payload;
};

const validatePayload = (payload) => {
  if (!payload.productName) {
    return "Product name is required";
  }

  if (!payload.destination) {
    return "Destination is required";
  }

  if (payload.quantity <= 0) {
    return "Quantity must be greater than zero";
  }

  return "";
};

const readAll = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Shipments retrieved",
      data: shipments
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reading shipments",
      error: error.message
    });
  }
};

const readSingle = async (req, res) => {
  const query = buildShipmentQuery(req.params.id);
  if (!query) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }

  try {
    const shipment = await Shipment.findOne(query).populate("tripId", "tripId vehicle driver from to");

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.status(200).json({
      message: "Shipment retrieved",
      data: shipment
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching shipment",
      error: error.message
    });
  }
};

const createShipment = async (req, res) => {
  try {
    const payload = normalizeShipmentPayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const enriched = await attachTripDetails(payload);
    const created = await new Shipment(enriched).save();

    res.status(200).json({
      message: "Shipment created",
      data: created
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating shipment",
      error: error.message
    });
  }
};

const updateShipment = async (req, res) => {
  const query = buildShipmentQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }

  try {
    const payload = normalizeShipmentPayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const enriched = await attachTripDetails(payload);
    const updated = await Shipment.findOneAndUpdate(query, enriched, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.status(200).json({
      message: "Shipment updated",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating shipment",
      error: error.message
    });
  }
};

const deleteShipment = async (req, res) => {
  const query = buildShipmentQuery(req.params.id);

  if (!query) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }

  try {
    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    await shipment.deleteOne();
    res.status(200).json({
      message: "Shipment deleted",
      data: shipment
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting shipment",
      error: error.message
    });
  }
};

module.exports = {
  createShipment,
  readAll,
  readSingle,
  updateShipment,
  deleteShipment
};
