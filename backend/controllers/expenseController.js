const pool = require('../config/db');

// Add an expense to a group (split equally among participants)
exports.addExpense = async (req, res) => {
  try {
    const { group_id, amount, description, participants } = req.body;
    const paidBy = req.user.id;

    if (!group_id || !amount || !participants || participants.length === 0) {
      return res.status(400).json({ message: 'group_id, amount, and participants are required.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive.' });
    }

    // Insert expense
    const [result] = await pool.query(
      'INSERT INTO expenses (group_id, paid_by, amount, description) VALUES (?, ?, ?, ?)',
      [group_id, paidBy, amount, description || '']
    );

    const expenseId = result.insertId;

    // Calculate equal split
    const splitAmount = parseFloat((amount / participants.length).toFixed(2));

    // Insert splits for each participant
    const splitValues = participants.map(userId => [expenseId, userId, splitAmount]);
    await pool.query(
      'INSERT INTO splits (expense_id, user_id, amount) VALUES ?',
      [splitValues]
    );

    res.status(201).json({
      message: 'Expense added successfully.',
      expense: { id: expenseId, group_id, paid_by: paidBy, amount, description },
      splits: participants.map(userId => ({ user_id: userId, amount: splitAmount }))
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error adding expense.' });
  }
};

// Get all expenses for a group
exports.getGroupExpenses = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const [expenses] = await pool.query(
      `SELECT e.*, u.name AS paid_by_name
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.group_id = ?
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    // Get splits for each expense
    for (let expense of expenses) {
      const [splits] = await pool.query(
        `SELECT s.*, u.name AS user_name
         FROM splits s
         JOIN users u ON s.user_id = u.id
         WHERE s.expense_id = ?`,
        [expense.id]
      );
      expense.splits = splits;
    }

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error fetching expenses.' });
  }
};
