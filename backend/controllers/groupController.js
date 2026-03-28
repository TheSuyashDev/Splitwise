const pool = require('../config/db');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const createdBy = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    // Create group
    const [result] = await pool.query(
      'INSERT INTO `groups` (name, created_by) VALUES (?, ?)',
      [name, createdBy]
    );

    // Add creator as a member
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [result.insertId, createdBy]
    );

    res.status(201).json({
      message: 'Group created successfully.',
      group: { id: result.insertId, name, created_by: createdBy }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error creating group.' });
  }
};

// Get all groups for the logged-in user
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await pool.query(
      `SELECT g.id, g.name, g.created_at, u.name AS created_by_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
       FROM \`groups\` g
       JOIN group_members gm ON g.id = gm.group_id
       JOIN users u ON g.created_by = u.id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error fetching groups.' });
  }
};

// Get group details by ID
exports.getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;

    // Get group info
    const [groups] = await pool.query(
      `SELECT g.*, u.name AS created_by_name
       FROM \`groups\` g
       JOIN users u ON g.created_by = u.id
       WHERE g.id = ?`,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Get members
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?`,
      [groupId]
    );

    res.json({ group: groups[0], members });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error fetching group.' });
  }
};

// Add member to group by email
exports.addMember = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Find user by email
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found with that email.' });
    }

    const user = users[0];

    // Check if already a member
    const [existing] = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User is already a member of this group.' });
    }

    // Add member
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, user.id]
    );

    res.status(201).json({
      message: 'Member added successfully.',
      member: user
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error adding member.' });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.params.userId;

    const [result] = await pool.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found in group.' });
    }

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error removing member.' });
  }
};
