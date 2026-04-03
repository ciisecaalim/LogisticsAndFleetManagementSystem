const Vehicle = require('../model/Vehicles');
const Driver = require('../model/Drivers');
const Trip = require('../model/Trips');
const Fuel = require('../model/fuel');

// ✅ DASHBOARD SUMMARY
const readAll = async (req, res) => {
  try {
    const [totalVehicles, activeTrips, totalDrivers, fuelRecords] = await Promise.all([
      Vehicle.countDocuments(),
      Trip.countDocuments({ status: 'Ongoing' }),
      Driver.countDocuments(),
      Fuel.find({}, { cost: 1 })
    ]);

    const fuelExpenses = fuelRecords.reduce((total, record) => total + Number(record.cost || 0), 0);

    res.status(200).json({
      message: 'Dashboard summary loaded successfully',
      data: {
        totalVehicles,
        activeTrips,
        totalDrivers,
        fuelExpenses
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error loading dashboard summary',
      error: error.message
    });
  }
};

module.exports = { readAll };
