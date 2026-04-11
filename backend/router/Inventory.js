const express = require('express');
const {
  createInventory,
  readAll,
  readSingle,
  updateInventory,
  deleteInventory
} = require('../controller/Inventory');

const router = express.Router();

router.post('/', createInventory);
router.get('/:id', readSingle);
router.get('/', readAll);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

module.exports = router;
