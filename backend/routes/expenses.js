const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addExpense, getGroupExpenses } = require('../controllers/expenseController');

router.post('/', auth, addExpense);
router.get('/:groupId', auth, getGroupExpenses);

module.exports = router;
