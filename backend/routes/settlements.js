const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { settle, getGroupSettlements } = require('../controllers/settlementController');

router.post('/', auth, settle);
router.get('/:groupId', auth, getGroupSettlements);

module.exports = router;
