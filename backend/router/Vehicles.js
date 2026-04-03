const express = require("express");
const { createVehicle, readAll, deleteVehicle, readSingle, vehicleUpdate } = require("../controller/Vehicles");

const router = express.Router();

// CREATE
router.post("/", createVehicle);

// READ SINGLE
router.get("/:id", readSingle);

// READ ALL
router.get("/", readAll);

// UPDATE
router.put("/:id", vehicleUpdate);

// DELETE
router.delete("/:id", deleteVehicle);

module.exports = router;
