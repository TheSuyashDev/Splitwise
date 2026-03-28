import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data.groups);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setCreating(true);
    setError('');
    try {
      await api.post('/groups', { name: groupName });
      setGroupName('');
      setShowModal(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const groupIcons = ['👥', '🏠', '✈️', '🍕', '🎉', '💼', '🎮', '🛒'];
  const getIcon = (id) => groupIcons[id % groupIcons.length];

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="subtitle">Manage your shared expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No groups yet</h3>
          <p>Create a group to start splitting expenses with friends.</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div
              key={group.id}
              className="card card-clickable group-card"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="group-icon">{getIcon(group.id)}</div>
              <div>
                <h3>{group.name}</h3>
                <div className="group-meta">
                  <span>👤 {group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                  <span>By {group.created_by_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Group</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupName">Group Name</label>
                <input
                  id="groupName"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Road Trip 2024"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
