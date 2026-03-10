import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/projects');
            setProjects(res.data);
        } catch {
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;
        try {
            await api.delete(`/api/projects/${id}`);
            setProjects(projects.filter(p => p._id !== id));
            setMessage({ type: 'success', text: '✅ Project deleted successfully.' });
        } catch {
            setMessage({ type: 'error', text: '❌ Failed to delete project.' });
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/api/projects/${id}`, { status: newStatus });
            setProjects(projects.map(p => p._id === id ? { ...p, status: newStatus } : p));
        } catch {
            alert('Failed to update status.');
        }
    };

    function getStatusBadge(status) {
        const map = { Active: 'badge-success', Completed: 'badge-info', 'On Hold': 'badge-warning', Cancelled: 'badge-danger' };
        return map[status] || 'badge-info';
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <div className="admin-topbar">
                    <span className="topbar-title">Project Management</span>
                    <div className="topbar-right">
                        <span className="admin-badge">📁 {projects.length} Total Projects</span>
                    </div>
                </div>

                <div className="admin-content">
                    <div className="page-header">
                        <h1 className="page-title">Project Directory</h1>
                        <p className="page-subtitle">View and manage all company projects across all departments</p>
                    </div>

                    {message && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="card animate-in">
                        <div className="card-title">📋 All Projects</div>
                        {loading ? (
                            <div className="loading"><div className="spinner"></div></div>
                        ) : projects.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📁</div>
                                <p>No projects found. Create one to get started!</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Project Name</th>
                                            <th>Client</th>
                                            <th>Team Lead</th>
                                            <th>Team Size</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((p) => (
                                            <tr key={p._id}>
                                                <td style={{ fontWeight: 600 }}>{p.project}</td>
                                                <td>{p.company}</td>
                                                <td>👤 {p.tl}</td>
                                                <td><span className="badge badge-purple">{p.members?.length || 0} Members</span></td>
                                                <td>{p.period_alloted || '—'}</td>
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                                                        value={p.status}
                                                        onChange={(e) => handleStatusChange(p._id, e.target.value)}
                                                    >
                                                        <option>Active</option>
                                                        <option>On Hold</option>
                                                        <option>Completed</option>
                                                        <option>Cancelled</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(p._id, p.project)}
                                                    >
                                                        🗑 Delete
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
