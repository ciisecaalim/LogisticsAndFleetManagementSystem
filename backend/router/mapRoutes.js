const express = require('express');
const { getMapVehicles } = require('../controller/mapController');

const router = express.Router();

router.get('/vehicles', getMapVehicles);

module.exports = router;
