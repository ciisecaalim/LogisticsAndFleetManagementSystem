const express = require("express");
const { readAll, readTrips, assignDriver, updateTracking, stream } = require("../controller/FleetMap");

const router = express.Router();

// READ MAP VEHICLES
router.get("/vehicles", readAll);
router.get("/trips", readTrips);

// REAL-TIME TRACKING
router.get("/stream", stream);
router.post("/assign", assignDriver);
router.post("/tracking", updateTracking);

module.exports = router;
