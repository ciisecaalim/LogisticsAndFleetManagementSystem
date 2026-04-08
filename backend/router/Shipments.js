const express = require("express");
const {
  createShipment,
  readAll,
  readSingle,
  updateShipment,
  deleteShipment
} = require("../controller/Shipments");

const router = express.Router();

router.get("/", readAll);
router.get("/:id", readSingle);
router.post("/", createShipment);
router.put("/:id", updateShipment);
router.delete("/:id", deleteShipment);

module.exports = router;
