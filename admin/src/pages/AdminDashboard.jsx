import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ employees: 0, projects: 0, active: 0, completed: 0 });
    const [recentProjects, setRecentProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [empRes, projRes] = await Promise.all([
                api.get('/api/employees'),
                api.get('/api/projects')
            ]);
            const projs = projRes.data;
            setStats({
                employees: empRes.data.length,
                projects: projs.length,
                active: projs.filter(p => p.status === 'Active').length,
                completed: projs.filter(p => p.status === 'Completed').length
            });
            setRecentProjects(projs.slice(0, 5));
        } catch { }
    };

    function getStatusBadge(status) {
        const map = { Active: 'badge-success', Completed: 'badge-info', 'On Hold': 'badge-warning' };
        return map[status] || 'badge-info';
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <div className="admin-topbar">
                    <span className="topbar-title">Dashboard Overview</span>
                    <div className="topbar-right">
                        <span className="admin-badge">⚙️ Admin</span>
                    </div>
                </div>

                <div className="admin-content">
                    <div className="page-header">
                        <h1 className="page-title">Welcome Back, Admin 👋</h1>
                        <p className="page-subtitle">Here's your workforce management overview</p>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)' }}>👥</div>
                            <div>
                                <div className="stat-value">{stats.employees}</div>
                                <div className="stat-label">Total Employees</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>📁</div>
                            <div>
                                <div className="stat-value">{stats.projects}</div>
                                <div className="stat-label">Total Projects</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
                            <div>
                                <div className="stat-value">{stats.active}</div>
                                <div className="stat-label">Active Projects</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🏁</div>
                            <div>
                                <div className="stat-value">{stats.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="card">
                        <div className="card-title" style={{ justifyContent: 'space-between' }}>
                            <span>📋 Recent Projects</span>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-project')}>
                                ➕ New Project
                            </button>
                        </div>
                        {recentProjects.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📂</div>
                                <p>No projects yet. Create your first project!</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Company</th>
                                            <th>Team Lead</th>
                                            <th>Members</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentProjects.map(p => (
                                            <tr key={p._id}>
                                                <td style={{ fontWeight: 600 }}>{p.project}</td>
                                                <td>{p.company}</td>
                                                <td>{p.tl}</td>
                                                <td>{p.members?.length || 0} members</td>
                                                <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                                                <td>
                                                    <button
                                                        id={`view-proj-${p._id}`}
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => navigate(`/projects`)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
