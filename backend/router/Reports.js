const express = require("express");
const { readAll } = require("../controller/Reports");

const router = express.Router();

// READ ALL REPORTS
router.get("/", readAll);

module.exports = router;
