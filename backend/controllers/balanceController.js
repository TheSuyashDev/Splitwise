const pool = require('../config/db');

// Get net balances for all members in a group
exports.getGroupBalances = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Get all members
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?`,
      [groupId]
    );

    // Calculate balances from expenses and splits
    // For each user: balance = (total they paid) - (total they owe from splits)
    const [balanceRows] = await pool.query(
      `SELECT
         u.id AS user_id,
         u.name,
         COALESCE(paid.total_paid, 0) AS total_paid,
         COALESCE(owed.total_owed, 0) AS total_owed,
         COALESCE(settled_out.total_settled_out, 0) AS total_settled_out,
         COALESCE(settled_in.total_settled_in, 0) AS total_settled_in
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       LEFT JOIN (
         SELECT paid_by, SUM(amount) AS total_paid
         FROM expenses WHERE group_id = ?
         GROUP BY paid_by
       ) paid ON u.id = paid.paid_by
       LEFT JOIN (
         SELECT s.user_id, SUM(s.amount) AS total_owed
         FROM splits s
         JOIN expenses e ON s.expense_id = e.id
         WHERE e.group_id = ?
         GROUP BY s.user_id
       ) owed ON u.id = owed.user_id
       LEFT JOIN (
         SELECT from_user, SUM(amount) AS total_settled_out
         FROM settlements WHERE group_id = ?
         GROUP BY from_user
       ) settled_out ON u.id = settled_out.from_user
       LEFT JOIN (
         SELECT to_user, SUM(amount) AS total_settled_in
         FROM settlements WHERE group_id = ?
         GROUP BY to_user
       ) settled_in ON u.id = settled_in.to_user
       WHERE gm.group_id = ?`,
      [groupId, groupId, groupId, groupId, groupId]
    );

    // Compute net balance for each user
    // Positive = others owe them, Negative = they owe others
    const balances = balanceRows.map(row => {
      const net = parseFloat(
        (
          (row.total_paid - row.total_owed) +
          (row.total_settled_out - row.total_settled_in)
        ).toFixed(2)
      );
      return {
        user_id: row.user_id,
        name: row.name,
        total_paid: parseFloat(row.total_paid),
        total_owed: parseFloat(row.total_owed),
        net_balance: net
      };
    });

    res.json({ balances });
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ message: 'Server error calculating balances.' });
  }
};
