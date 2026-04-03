const express = require('express');
const createCrudRouter = require('./createCrudRouter');
const {
	vehicleController,
	driverController,
	tripController,
	fuelController,
	maintenanceController
} = require('../controller/resourceControllers');

const router = express.Router();

router.use('/vehicles', createCrudRouter(vehicleController));
router.use('/drivers', createCrudRouter(driverController));
router.use('/trips', createCrudRouter(tripController));
router.use('/fuel', createCrudRouter(fuelController));
router.use('/maintenance', createCrudRouter(maintenanceController));

module.exports = router;
