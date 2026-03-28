const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember,
  removeMember
} = require('../controllers/groupController');

router.post('/', auth, createGroup);
router.get('/', auth, getUserGroups);
router.get('/:id', auth, getGroupById);
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);

module.exports = router;
