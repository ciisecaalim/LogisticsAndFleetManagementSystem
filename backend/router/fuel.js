const express = require("express");
const { createFuel, readAll, deleteFuel, readSingle, fuelUpdate } = require("../controller/fuel");

const router = express.Router();

// CREATE
router.post("/", createFuel);

// READ SINGLE
router.get("/:id", readSingle);

// READ ALL
router.get("/", readAll);

// UPDATE
router.put("/:id", fuelUpdate);

// DELETE
router.delete("/:id", deleteFuel);

module.exports = router;
