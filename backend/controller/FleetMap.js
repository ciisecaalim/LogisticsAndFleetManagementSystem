const Vehicle = require("../model/Vehicles");
const Trip = require("../model/Trips");

// ✅ MAP VEHICLES
const readAll = async (req, res) => {
  try {
    const [vehicles, trips] = await Promise.all([Vehicle.find(), Trip.find()]);

    const data = vehicles.map((vehicle) => {
      const matchedTrip = trips.find((trip) => trip.vehicle.startsWith(vehicle.plateNumber));

      const statusMap = {
        Active: "Moving",
        "In Maintenance": "Stopped",
        Idle: "Idle"
      };

      return {
        id: vehicle._id,
        name: vehicle.plateNumber,
        driver: vehicle.assignedDriver,
        status: statusMap[vehicle.status] || "Idle",
        location: matchedTrip ? `${matchedTrip.from} -> ${matchedTrip.to}` : "Unknown route",
        lat: vehicle.lat,
        lng: vehicle.lng,
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
