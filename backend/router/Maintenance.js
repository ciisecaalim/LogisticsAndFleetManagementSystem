const express = require("express");
const { createMaintenance, readAll, deleteMaintenance, readSingle, maintenanceUpdate } = require("../controller/Maintenance");

const router = express.Router();

// CREATE
router.post("/", createMaintenance);

// READ SINGLE
router.get("/:id", readSingle);

// READ ALL
router.get("/", readAll);

// UPDATE
router.put("/:id", maintenanceUpdate);

// DELETE
router.delete("/:id", deleteMaintenance);

module.exports = router;
