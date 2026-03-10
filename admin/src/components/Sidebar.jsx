import { Link, useNavigate, useLocation } from 'react-router-dom';

const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/employees', icon: '👥', label: 'Employees' },
    { to: '/projects', icon: '📁', label: 'Projects' },
    { to: '/create-project', icon: '➕', label: 'New Project' },
];

export default function Sidebar({ title }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">⚙️</div>
                <div>
                    <div className="sidebar-title">WorkforceOS</div>
                    <div className="sidebar-subtitle">Admin Panel</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-label">Main Menu</div>
                {navItems.map(item => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
                        id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button
                    id="admin-logout-btn"
                    className="btn btn-danger btn-sm btn-full"
                    onClick={handleLogout}
                >
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}
