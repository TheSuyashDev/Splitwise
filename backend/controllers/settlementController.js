const pool = require('../config/db');

// Record a settlement between two users
exports.settle = async (req, res) => {
  try {
    const { group_id, to_user, amount } = req.body;
    const fromUser = req.user.id;

    if (!group_id || !to_user || !amount) {
      return res.status(400).json({ message: 'group_id, to_user, and amount are required.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive.' });
    }

    if (fromUser === to_user) {
      return res.status(400).json({ message: 'Cannot settle with yourself.' });
    }

    // Insert settlement
    const [result] = await pool.query(
      'INSERT INTO settlements (group_id, from_user, to_user, amount) VALUES (?, ?, ?, ?)',
      [group_id, fromUser, to_user, amount]
    );

    res.status(201).json({
      message: 'Settlement recorded successfully.',
      settlement: {
        id: result.insertId,
        group_id,
        from_user: fromUser,
        to_user,
        amount
      }
    });
  } catch (error) {
    console.error('Settlement error:', error);
    res.status(500).json({ message: 'Server error recording settlement.' });
  }
};

// Get settlements for a group
exports.getGroupSettlements = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const [settlements] = await pool.query(
      `SELECT s.*, 
              fu.name AS from_user_name,
              tu.name AS to_user_name
       FROM settlements s
       JOIN users fu ON s.from_user = fu.id
       JOIN users tu ON s.to_user = tu.id
       WHERE s.group_id = ?
       ORDER BY s.created_at DESC`,
      [groupId]
    );

    res.json({ settlements });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ message: 'Server error fetching settlements.' });
  }
};
