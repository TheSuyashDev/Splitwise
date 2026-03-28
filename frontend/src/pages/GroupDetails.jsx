import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');

  // Modal states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettle, setShowSettle] = useState(false);

  // Form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [settleToUser, setSettleToUser] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const [groupRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/${id}`),
        api.get(`/balances/${id}`),
        api.get(`/settle/${id}`)
      ]);
      setGroup(groupRes.data.group);
      setMembers(groupRes.data.members);
      setExpenses(expensesRes.data.expenses);
      setBalances(balancesRes.data.balances);
      setSettlements(settlementsRes.data.settlements);
    } catch (err) {
      console.error('Error loading group:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }
    if (selectedParticipants.length === 0) {
      setFormError('Select at least one participant.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/expenses', {
        group_id: parseInt(id),
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        participants: selectedParticipants
      });
      setShowAddExpense(false);
      resetExpenseForm();
      loadGroupData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseDesc('');
    setExpenseAmount('');
    setSelectedParticipants([]);
    setFormError('');
  };

  // Add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    setSubmitting(true);
    try {
      await api.post(`/groups/${id}/members`, { email: memberEmail });
      setFormSuccess('Member added!');
      setMemberEmail('');
      loadGroupData();
      setTimeout(() => {
        setShowAddMember(false);
        setFormSuccess('');
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  // Settle
  const handleSettle = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!settleToUser || !settleAmount || parseFloat(settleAmount) <= 0) {
      setFormError('Select a user and enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/settle', {
        group_id: parseInt(id),
        to_user: parseInt(settleToUser),
        amount: parseFloat(settleAmount)
      });
      setShowSettle(false);
      setSettleToUser('');
      setSettleAmount('');
      loadGroupData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to settle.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllParticipants = () => {
    if (selectedParticipants.length === members.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(members.map(m => m.id));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-details">
        <div className="empty-state">
          <h3>Group not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-details">
      {/* Header */}
      <div className="group-details-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: '0.75rem' }}>
            ← Back
          </button>
          <h1>{group.name}</h1>
        </div>
        <div className="group-details-actions">
          <button className="btn btn-secondary" onClick={() => { setFormError(''); setShowAddMember(true); }}>
            + Add Member
          </button>
          <button className="btn btn-success" onClick={() => { setFormError(''); setShowSettle(true); }}>
            💸 Settle Up
          </button>
          <button className="btn btn-primary" onClick={() => { resetExpenseForm(); setShowAddExpense(true); }}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['expenses', 'balances', 'members', 'settlements'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' && (
        <div className="card">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <h3>No expenses yet</h3>
              <p>Add your first expense to start tracking.</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-icon">🧾</div>
                  <div>
                    <div className="expense-desc">{expense.description || 'Untitled Expense'}</div>
                    <div className="expense-by">
                      Paid by {expense.paid_by_name} • {formatDate(expense.created_at)}
                    </div>
                  </div>
                </div>
                <div className="expense-amount">{formatCurrency(expense.amount)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="card">
          {balances.length === 0 ? (
            <div className="empty-state">
              <h3>No balances</h3>
            </div>
          ) : (
            balances.map((b) => (
              <div key={b.user_id} className="balance-item">
                <div className="balance-name">
                  <div className="balance-avatar">
                    {b.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div>{b.name} {b.user_id === user?.id ? '(You)' : ''}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Paid: {formatCurrency(b.total_paid)} • Owed: {formatCurrency(b.total_owed)}
                    </div>
                  </div>
                </div>
                <div className={`balance-amount ${b.net_balance > 0 ? 'balance-positive' : b.net_balance < 0 ? 'balance-negative' : 'balance-zero'}`}>
                  {b.net_balance > 0 ? `Gets back ${formatCurrency(b.net_balance)}`
                    : b.net_balance < 0 ? `Owes ${formatCurrency(Math.abs(b.net_balance))}`
                    : 'Settled up ✓'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card">
          {members.map((m) => (
            <div key={m.id} className="member-item">
              <div className="member-info">
                <div className="member-avatar">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="member-name">
                    {m.name} {m.id === user?.id ? '(You)' : ''}
                  </div>
                  <div className="member-email">{m.email}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="card">
          {settlements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <h3>No settlements yet</h3>
              <p>Settle debts when you're ready.</p>
            </div>
          ) : (
            settlements.map((s) => (
              <div key={s.id} className="settlement-item">
                <div>
                  <div className="settlement-flow">
                    <span>{s.from_user_name}</span>
                    <span className="settlement-arrow">→</span>
                    <span>{s.to_user_name}</span>
                  </div>
                  <div className="settlement-date">{formatDate(s.created_at)}</div>
                </div>
                <div className="settlement-amount">{formatCurrency(s.amount)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Expense</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label htmlFor="expDesc">Description</label>
                <input
                  id="expDesc"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Dinner at restaurant"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="expAmount">Amount (₹)</label>
                <input
                  id="expAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Split among
                  <button type="button" style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={selectAllParticipants}>
                    {selectedParticipants.length === members.length ? 'Deselect All' : 'Select All'}
                  </button>
                </label>
                <div className="checkbox-list">
                  {members.map((m) => (
                    <label key={m.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(m.id)}
                        onChange={() => toggleParticipant(m.id)}
                      />
                      <span>{m.name} {m.id === user?.id ? '(You)' : ''}</span>
                    </label>
                  ))}
                </div>
                {selectedParticipants.length > 0 && expenseAmount && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Each person pays: {formatCurrency(parseFloat(expenseAmount) / selectedParticipants.length)}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddExpense(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Member</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label htmlFor="memberEmail">Member's Email</label>
                <input
                  id="memberEmail"
                  type="email"
                  className="form-control"
                  placeholder="friend@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {showSettle && (
        <div className="modal-overlay" onClick={() => setShowSettle(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settle Up</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSettle}>
              <div className="form-group">
                <label htmlFor="settleTo">Pay To</label>
                <select
                  id="settleTo"
                  className="form-control"
                  value={settleToUser}
                  onChange={(e) => setSettleToUser(e.target.value)}
                  required
                >
                  <option value="">Select a member</option>
                  {members
                    .filter(m => m.id !== user?.id)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="settleAmt">Amount (₹)</label>
                <input
                  id="settleAmt"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettle(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Settling...' : 'Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
