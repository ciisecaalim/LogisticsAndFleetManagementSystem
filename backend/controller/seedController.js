const Vehicle = require('../model/Vehicles');
const Driver = require('../model/Drivers');
const Trip = require('../model/Trips');
const Fuel = require('../model/fuel');
const Maintenance = require('../model/Maintenance');
const Report = require('../model/Reports');
const Setting = require('../model/Setting');
const sampleData = require('../model/sampleData');

// ✅ SEED DATABASE IF EMPTY
const seedDatabase = async () => {
  const collections = [
    { model: Vehicle, data: sampleData.vehicles },
    { model: Driver, data: sampleData.drivers },
    { model: Trip, data: sampleData.trips },
    { model: Fuel, data: sampleData.fuel },
    { model: Maintenance, data: sampleData.maintenance },
    { model: Report, data: sampleData.reports },
    { model: Setting, data: sampleData.settings }
  ];

  for (const item of collections) {
    const total = await item.model.countDocuments();
    if (total === 0) {
      await item.model.insertMany(item.data);
    }
  }
};

module.exports = { seedDatabase };
