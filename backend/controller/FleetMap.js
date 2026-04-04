const mongoose = require("mongoose");
const Vehicle = require("../model/Vehicles");
const Driver = require("../model/Drivers");
const Trip = require("../model/Trips");

const streamClients = new Set();
const pendingNotifications = [];
let simulationTimer = null;

const toSafeDate = (value) => {
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const normalizeFleetStatus = (vehicleStatus, tripStatus) => {
  const rawVehicleStatus = String(vehicleStatus || "").trim().toLowerCase();
  const rawTripStatus = String(tripStatus || "").trim().toLowerCase();

  if (rawVehicleStatus === "off" || rawVehicleStatus === "inactive") {
    return "Off";
  }

  if (rawTripStatus === "ongoing" || rawTripStatus === "pending" || rawVehicleStatus === "assigned") {
    return "Assigned";
  }

  return "Available";
};

const getGpsStatus = (lastUpdate) => {
  const ageMs = Date.now() - toSafeDate(lastUpdate).getTime();

  if (ageMs < 60 * 1000) {
    return "Online";
  }

  if (ageMs < 5 * 60 * 1000) {
    return "Last Seen";
  }

  return "Offline";
};

const hashCoordinate = (label = "", axis = "lat") => {
  const normalized = String(label || "unknown").toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33 + normalized.charCodeAt(index)) % 10000;
  }

  if (axis === "lat") {
    return 39.5 + (hash % 1800) / 1000;
  }

  return -75 + (hash % 1800) / 1000;
};

const toLocation = (source, fallbackLabel) => {
  if (source && typeof source === "object") {
    const label = String(source.label || fallbackLabel || "").trim();
    return {
      label,
      lat: Number(source.lat ?? hashCoordinate(label, "lat")),
      lng: Number(source.lng ?? hashCoordinate(label, "lng"))
    };
  }

  const label = String(source || fallbackLabel || "").trim();
  return {
    label,
    lat: hashCoordinate(label, "lat"),
    lng: hashCoordinate(label, "lng")
  };
};

const haversineKm = (pointA, pointB) => {
  const rad = Math.PI / 180;
  const dLat = (pointB.lat - pointA.lat) * rad;
  const dLng = (pointB.lng - pointA.lng) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pointA.lat * rad) * Math.cos(pointB.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

const pointToSegmentDistance = (point, start, end) => {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((point.lng - start.lng) ** 2 + (point.lat - start.lat) ** 2);
  }

  const t = ((point.lng - start.lng) * dx + (point.lat - start.lat) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));

  const closest = {
    lng: start.lng + clamped * dx,
    lat: start.lat + clamped * dy
  };

  return Math.sqrt((point.lng - closest.lng) ** 2 + (point.lat - closest.lat) ** 2);
};

const buildTripSnapshot = (trip, vehicle) => {
  const startLocation = toLocation(trip.startLocation, trip.from);
  const destination = toLocation(trip.destination, trip.to);

  const current = {
    lat: Number(vehicle?.gps?.lat ?? vehicle?.lat ?? startLocation.lat),
    lng: Number(vehicle?.gps?.lng ?? vehicle?.lng ?? startLocation.lng)
  };

  const routeDistance = Math.max(0.0001, haversineKm(startLocation, destination));
  const remainingDistance = haversineKm(current, destination);
  const progressPercent = Math.max(0, Math.min(100, Math.round(((routeDistance - remainingDistance) / routeDistance) * 100)));

  const deviationMagnitude = pointToSegmentDistance(current, startLocation, destination);
  const isDeviation = deviationMagnitude > 0.09;
  const reachedDestination = remainingDistance < 0.4;

  return {
    id: String(trip._id),
    tripId: trip.tripId || String(trip._id),
    vehicleId: trip.vehicleId,
    vehicle: trip.vehicle,
    driverId: trip.driverId,
    driver: trip.driver,
    status: trip.status,
    from: trip.from,
    to: trip.to,
    departureTime: trip.departureTime,
    expectedArrivalTime: trip.expectedArrivalTime,
    startLocation,
    destination,
    currentLocation: {
      label: vehicle?.currentLocation?.label || "Current position",
      lat: current.lat,
      lng: current.lng
    },
    progressPercent,
    routeDistanceKm: Number(routeDistance.toFixed(2)),
    remainingDistanceKm: Number(remainingDistance.toFixed(2)),
    isDeviation,
    reachedDestination
  };
};

const queueNotification = (notification) => {
  pendingNotifications.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...notification
  });

  if (pendingNotifications.length > 50) {
    pendingNotifications.splice(0, pendingNotifications.length - 50);
  }
};

const buildSnapshot = async () => {
  const [vehicles, trips] = await Promise.all([
    Vehicle.find(),
    Trip.find().sort({ createdAt: -1 })
  ]);

  const tripsByVehicle = trips.reduce((acc, trip) => {
    const keys = [trip.vehicleId, trip.vehicle].filter(Boolean);
    keys.forEach((key) => {
      acc[String(key).toLowerCase()] = trip;
    });
    return acc;
  }, {});

  const mapVehicles = vehicles.map((vehicle) => {
    const matchedTrip =
      tripsByVehicle[String(vehicle.vehicleId || "").toLowerCase()] ||
      tripsByVehicle[String(vehicle.plateNumber || "").toLowerCase()] ||
      null;

    const tripSnapshot = matchedTrip ? buildTripSnapshot(matchedTrip, vehicle) : null;
    const fleetStatus = normalizeFleetStatus(vehicle.status, matchedTrip?.status);

    return {
      id: String(vehicle._id),
      vehicleId: vehicle.vehicleId || String(vehicle._id),
      trackerId: vehicle.trackerId || "",
      plateNumber: vehicle.plateNumber,
      name: vehicle.plateNumber,
      model: vehicle.model,
      driver: vehicle.assignedDriver || matchedTrip?.driver || "Unassigned",
      driverId: vehicle.assignedDriverId || matchedTrip?.driverId || "",
      status: fleetStatus,
      businessStatus: vehicle.status,
      gpsStatus: getGpsStatus(vehicle.gps?.lastUpdate || vehicle.lastUpdate || vehicle.updatedAt),
      lastUpdate: toSafeDate(vehicle.gps?.lastUpdate || vehicle.lastUpdate || vehicle.updatedAt),
      location: tripSnapshot ? `${tripSnapshot.from} -> ${tripSnapshot.to}` : "No assigned route",
      lat: Number(vehicle.gps?.lat ?? vehicle.lat ?? 0),
      lng: Number(vehicle.gps?.lng ?? vehicle.lng ?? 0),
      speedKmh: fleetStatus === "Assigned" ? 45 : 0,
      distanceTraveledKm: tripSnapshot ? Number((tripSnapshot.routeDistanceKm - tripSnapshot.remainingDistanceKm).toFixed(2)) : 0,
      heading: 0,
      destination: tripSnapshot?.destination || toLocation(vehicle.destination, vehicle.destination?.label),
      currentLocation: tripSnapshot?.currentLocation || toLocation(vehicle.currentLocation, vehicle.currentLocation?.label)
    };
  });

  const tripSnapshots = trips.map((trip) => {
    const vehicle = vehicles.find((item) => {
      const tripVehicleKey = String(trip.vehicleId || trip.vehicle || "").toLowerCase();
      return (
        String(item.vehicleId || "").toLowerCase() === tripVehicleKey ||
        String(item.plateNumber || "").toLowerCase() === tripVehicleKey
      );
    });

    return buildTripSnapshot(trip, vehicle);
  });

  const notifications = pendingNotifications.splice(0, pendingNotifications.length);

  return {
    vehicles: mapVehicles,
    trips: tripSnapshots,
    notifications
  };
};

const broadcastSnapshot = async () => {
  if (!streamClients.size) {
    return;
  }

  try {
    const snapshot = await buildSnapshot();
    const payload = `data: ${JSON.stringify(snapshot)}\n\n`;

    streamClients.forEach((res) => {
      res.write(payload);
    });
  } catch {
    // Ignore stream broadcast errors and keep the interval alive.
  }
};

const runSimulationTick = async () => {
  const trips = await Trip.find({ status: { $in: ["Pending", "Ongoing"] } });

  for (const trip of trips) {
    const vehicle = await Vehicle.findOne({
      $or: [{ vehicleId: trip.vehicleId }, { plateNumber: trip.vehicle }, { _id: mongoose.isValidObjectId(trip.vehicleId) ? trip.vehicleId : null }]
    });

    if (!vehicle) {
      continue;
    }

    const tripSnapshot = buildTripSnapshot(trip, vehicle);

    const nextLat = tripSnapshot.currentLocation.lat + (tripSnapshot.destination.lat - tripSnapshot.currentLocation.lat) * 0.14;
    const nextLng = tripSnapshot.currentLocation.lng + (tripSnapshot.destination.lng - tripSnapshot.currentLocation.lng) * 0.14;

    vehicle.gps = {
      lat: nextLat,
      lng: nextLng,
      lastUpdate: new Date()
    };
    vehicle.lat = nextLat;
    vehicle.lng = nextLng;
    vehicle.lastUpdate = new Date();
    vehicle.currentLocation = {
      label: `On route to ${trip.to}`,
      lat: nextLat,
      lng: nextLng
    };
    vehicle.destination = tripSnapshot.destination;

    if (tripSnapshot.reachedDestination) {
      trip.status = "Completed";
      trip.progressPercent = 100;
      if (!trip.destinationReachedAlerted) {
        queueNotification({
          level: "success",
          type: "destination-reached",
          tripId: trip.tripId || String(trip._id),
          vehicle: trip.vehicle,
          message: `${trip.vehicle} reached ${trip.to}`
        });
      }
      trip.destinationReachedAlerted = true;
      trip.actualArrivalTime = new Date();

      vehicle.status = "Available";
      vehicle.assignedDriver = "Unassigned";
      vehicle.assignedDriverId = "";

      const driver = await Driver.findOne({
        $or: [{ driverId: trip.driverId }, { name: trip.driver }]
      });
      if (driver) {
        driver.status = "Available";
        await driver.save();
      }
    } else {
      trip.status = "Ongoing";
      trip.progressPercent = tripSnapshot.progressPercent;
      vehicle.status = "Assigned";

      if (tripSnapshot.isDeviation && !trip.routeDeviationAlerted) {
        queueNotification({
          level: "warning",
          type: "route-deviation",
          tripId: trip.tripId || String(trip._id),
          vehicle: trip.vehicle,
          message: `${trip.vehicle} appears to be deviating from route ${trip.from} -> ${trip.to}`
        });
      }

      trip.routeDeviationAlerted = tripSnapshot.isDeviation;
    }

    await Promise.all([vehicle.save(), trip.save()]);
  }

  await broadcastSnapshot();
};

const ensureSimulation = () => {
  if (simulationTimer) {
    return;
  }

  simulationTimer = setInterval(() => {
    runSimulationTick().catch(() => {
      // Keep simulation running even when one tick fails.
    });
  }, 5000);
};

const applyFilters = (vehicles, query = {}) => {
  const statusFilter = String(query.status || "All").toLowerCase();
  const driverFilter = String(query.driver || "All").toLowerCase();

  return vehicles.filter((vehicle) => {
    const byStatus = statusFilter === "all" ? true : String(vehicle.status).toLowerCase() === statusFilter;
    const byDriver =
      driverFilter === "all" ? true : String(vehicle.driver || "unassigned").toLowerCase().includes(driverFilter);

    return byStatus && byDriver;
  });
};

const readAll = async (req, res) => {
  try {
    ensureSimulation();
    const snapshot = await buildSnapshot();

    res.status(200).json({
      message: "Map vehicles loaded successfully",
      data: applyFilters(snapshot.vehicles, req.query)
    });
  } catch (error) {
    res.status(500).json({
      message: "Error loading map vehicles",
      error: error.message
    });
  }
};

const readTrips = async (req, res) => {
  try {
    ensureSimulation();
    const snapshot = await buildSnapshot();

    res.status(200).json({
      message: "Map trips loaded successfully",
      data: snapshot.trips
    });
  } catch (error) {
    res.status(500).json({
      message: "Error loading map trips",
      error: error.message
    });
  }
};

const assignDriver = async (req, res) => {
  const { vehicleId, driverId } = req.body || {};

  if (!vehicleId || !driverId) {
    return res.status(400).json({ message: "vehicleId and driverId are required" });
  }

  try {
    const vehicle = await Vehicle.findOne({
      $or: [{ vehicleId }, { plateNumber: vehicleId }, { _id: mongoose.Types.ObjectId.isValid(vehicleId) ? vehicleId : null }]
    });

    const driver = await Driver.findOne({
      $or: [{ driverId }, { name: driverId }, { _id: mongoose.Types.ObjectId.isValid(driverId) ? driverId : null }]
    });

    if (!vehicle || !driver) {
      return res.status(404).json({ message: "Vehicle or driver not found" });
    }

    vehicle.assignedDriver = driver.name;
    vehicle.assignedDriverId = driver.driverId || String(driver._id);
    vehicle.status = "Assigned";
    driver.status = "Assigned";

    await Promise.all([vehicle.save(), driver.save()]);

    queueNotification({
      level: "info",
      type: "assignment",
      vehicle: vehicle.plateNumber,
      message: `${driver.name} was assigned to ${vehicle.plateNumber}`
    });

    await broadcastSnapshot();

    return res.status(200).json({
      message: "Driver assigned to vehicle",
      data: {
        vehicleId: vehicle.vehicleId || String(vehicle._id),
        driverId: driver.driverId || String(driver._id)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to assign driver",
      error: error.message
    });
  }
};

const updateTracking = async (req, res) => {
  const { vehicleId, trackerId, lat, lng } = req.body || {};
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if ((!vehicleId && !trackerId) || Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    return res.status(400).json({ message: "vehicleId or trackerId and valid lat/lng are required" });
  }

  try {
    const vehicle = await Vehicle.findOne({
      $or: [
        { vehicleId },
        { trackerId },
        { plateNumber: vehicleId },
        { _id: mongoose.Types.ObjectId.isValid(vehicleId) ? vehicleId : null }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    vehicle.gps = { lat: parsedLat, lng: parsedLng, lastUpdate: new Date() };
    vehicle.lat = parsedLat;
    vehicle.lng = parsedLng;
    vehicle.lastUpdate = new Date();

    const activeTrip = await Trip.findOne({
      $or: [{ vehicleId: vehicle.vehicleId }, { vehicle: vehicle.plateNumber }],
      status: { $in: ["Pending", "Ongoing"] }
    });

    if (activeTrip) {
      const snapshot = buildTripSnapshot(activeTrip, vehicle);

      if (snapshot.reachedDestination && !activeTrip.destinationReachedAlerted) {
        activeTrip.destinationReachedAlerted = true;
        activeTrip.status = "Completed";
        activeTrip.progressPercent = 100;
        activeTrip.actualArrivalTime = new Date();
        vehicle.status = "Available";
        queueNotification({
          level: "success",
          type: "destination-reached",
          vehicle: vehicle.plateNumber,
          tripId: activeTrip.tripId || String(activeTrip._id),
          message: `${vehicle.plateNumber} reached ${activeTrip.to}`
        });
      } else {
        activeTrip.status = "Ongoing";
        activeTrip.progressPercent = snapshot.progressPercent;
        activeTrip.routeDeviationAlerted = snapshot.isDeviation;

        if (snapshot.isDeviation) {
          queueNotification({
            level: "warning",
            type: "route-deviation",
            vehicle: vehicle.plateNumber,
            tripId: activeTrip.tripId || String(activeTrip._id),
            message: `${vehicle.plateNumber} deviated from the planned route`
          });
        }
      }

      await activeTrip.save();
    }

    await vehicle.save();
    await broadcastSnapshot();

    return res.status(200).json({
      message: "Tracking updated",
      data: {
        vehicleId: vehicle.vehicleId || String(vehicle._id),
        lat: parsedLat,
        lng: parsedLng,
        lastUpdate: vehicle.lastUpdate
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update tracking",
      error: error.message
    });
  }
};

const stream = async (req, res) => {
  ensureSimulation();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders?.();

  streamClients.add(res);

  try {
    const initial = await buildSnapshot();
    res.write(`data: ${JSON.stringify(initial)}\n\n`);
  } catch {
    res.write(`data: ${JSON.stringify({ vehicles: [], trips: [], notifications: [] })}\n\n`);
  }

  req.on("close", () => {
    streamClients.delete(res);
  });
};

module.exports = { readAll, readTrips, assignDriver, updateTracking, stream };
