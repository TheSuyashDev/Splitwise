import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-logo">
        <span className="logo-icon">💰</span>
        Splitwise
      </Link>

      <div className="navbar-links">
        <div className="navbar-user">
          <span>{user?.name}</span>
          <div className="avatar">{initials}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
