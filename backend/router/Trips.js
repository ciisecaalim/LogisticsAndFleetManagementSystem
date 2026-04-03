const express = require("express");
const { createTrip, readAll, deleteTrip, readSingle, tripUpdate } = require("../controller/Trips");

const router = express.Router();

// CREATE
router.post("/", createTrip);

// READ SINGLE
router.get("/:id", readSingle);

// READ ALL
router.get("/", readAll);

// UPDATE
router.put("/:id", tripUpdate);

// DELETE
router.delete("/:id", deleteTrip);

module.exports = router;
