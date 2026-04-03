const Vehicle = require('../model/Vehicles');
const Driver = require('../model/Drivers');
const Trip = require('../model/Trips');
const Fuel = require('../model/fuel');
const Maintenance = require('../model/Maintenance');

// ✅ SYSTEM DATA
const readAll = async (req, res) => {
  try {
    const [vehicles, drivers, trips, fuel, maintenance] = await Promise.all([
      Vehicle.find(),
      Driver.find(),
      Trip.find(),
      Fuel.find(),
      Maintenance.find()
    ]);

    res.status(200).json({
      message: 'System data loaded successfully',
      data: {
        vehicles,
        drivers,
        trips,
        fuel,
        maintenance
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error loading system data',
      error: error.message
    });
  }
};

// ✅ HEALTH CHECK
const health = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running'
  });
};

module.exports = { readAll, health };
