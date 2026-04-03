const express = require("express");
const { readAll } = require("../controller/Setting");

const router = express.Router();

// READ ALL SETTINGS
router.get("/", readAll);

module.exports = router;
