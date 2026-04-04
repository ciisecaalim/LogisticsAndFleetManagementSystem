const Vehicle = require("../model/Vehicles");
const Trip = require("../model/Trips");

const toGpsDate = (value) => {
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const getGpsStatus = (lastUpdate) => {
  const ageMs = Date.now() - toGpsDate(lastUpdate).getTime();

  if (ageMs < 60 * 1000) {
    return "Online";
  }

  if (ageMs < 5 * 60 * 1000) {
    return "Last Seen";
  }

  return "Offline";
};

// ✅ MAP VEHICLES
const readAll = async (req, res) => {
  try {
    const [vehicles, trips] = await Promise.all([Vehicle.find(), Trip.find()]);

    const data = vehicles.map((vehicle) => {
      const matchedTrip = trips.find((trip) => trip.vehicle.startsWith(vehicle.plateNumber));

      const gpsLat = Number(vehicle.gps?.lat ?? vehicle.lat ?? 0);
      const gpsLng = Number(vehicle.gps?.lng ?? vehicle.lng ?? 0);
      const gpsLastUpdate = toGpsDate(vehicle.gps?.lastUpdate || vehicle.lastUpdate || vehicle.updatedAt);
      const gpsStatus = getGpsStatus(gpsLastUpdate);

      return {
        id: vehicle._id,
        plateNumber: vehicle.plateNumber,
        name: vehicle.plateNumber,
        type: vehicle.type,
        driver: vehicle.assignedDriver,
        status: vehicle.status,
        gpsStatus,
        lastUpdate: gpsLastUpdate,
        location: matchedTrip ? `${matchedTrip.from} -> ${matchedTrip.to}` : "Unknown route",
        lat: gpsLat,
        lng: gpsLng,
        speedKmh: vehicle.status === "Active" ? 45 : 0,
        distanceTraveledKm: matchedTrip ? matchedTrip.distance : 0,
        heading: 0
      };
    });

    res.status(200).json({
      message: "Map vehicles loaded successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Error loading map vehicles",
      error: error.message
    });
  }
};

module.exports = { readAll };
