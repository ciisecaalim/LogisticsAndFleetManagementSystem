const express = require('express');
const { getSystemData, getHealth } = require('../controller/systemController');

const router = express.Router();

router.get('/system', getSystemData);
router.get('/health', getHealth);

module.exports = router;
