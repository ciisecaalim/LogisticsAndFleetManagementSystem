const express = require("express");
const { readAll } = require("../controller/FleetMap");

const router = express.Router();

// READ MAP VEHICLES
router.get("/vehicles", readAll);

module.exports = router;
