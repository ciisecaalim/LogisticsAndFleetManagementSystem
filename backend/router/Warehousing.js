const express = require('express');
const {
  createWarehousing,
  readAll,
  readSingle,
  updateWarehousing,
  deleteWarehousing
} = require('../controller/Warehousing');

const router = express.Router();

router.post('/', createWarehousing);
router.get('/:id', readSingle);
router.get('/', readAll);
router.put('/:id', updateWarehousing);
router.delete('/:id', deleteWarehousing);

module.exports = router;