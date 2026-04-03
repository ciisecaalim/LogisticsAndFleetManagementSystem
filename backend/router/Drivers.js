const express = require("express");
const { createDriver, readAll, deleteDriver, readSingle, driverUpdate } = require("../controller/Drivers");

const router = express.Router();

// CREATE
router.post("/", createDriver);

// READ SINGLE
router.get("/:id", readSingle);

// READ ALL
router.get("/", readAll);

// UPDATE
router.put("/:id", driverUpdate);

// DELETE
router.delete("/:id", deleteDriver);

module.exports = router;
