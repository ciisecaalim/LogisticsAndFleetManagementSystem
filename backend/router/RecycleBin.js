const express = require('express');
const { listRecycleBinEntries, restoreEntry, deleteEntry } = require('../controller/recycleBinController');

const router = express.Router();

router.get('/', listRecycleBinEntries);
router.post('/restore/:id', restoreEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
