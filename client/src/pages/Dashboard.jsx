import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function getStatusBadge(status) {
    const map = { Active: 'badge-success', Completed: 'badge-info', 'On Hold': 'badge-warning', Cancelled: 'badge-danger' };
    return map[status] || 'badge-info';
}

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ragSummary, setRagSummary] = useState('');
    const [ragLoading, setRagLoading] = useState(false);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/projects/user/${user.id}`);
            setProjects(res.data);
        } catch {
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRagSummary = async () => {
        if (!projects.length) return;
        setRagLoading(true);
        const p = projects[0];
        try {
            const res = await api.post('/api/rag/project-summary', {
                project_name: p.project,
                company: p.company,
                prob_statement: p.prob_statement,
                requirements: p.requirements,
                members: (p.members || []).map(m => typeof m === 'string' ? m : m.name),
                members: p.members,
                status: p.status
            });
            setRagSummary(res.data.summary || 'No summary available.');
        } catch {
            setRagSummary('⚠️ RAG service is currently unavailable. Please ensure the Python service is running.');
        } finally {
            setRagLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <a className="navbar-brand" href="/dashboard">
                    <div className="brand-icon">🏢</div>
                    WorkforceOS
                </a>
                <div className="navbar-actions">
                    <div className="navbar-user">
                        <div className="avatar">{user.username?.[0]?.toUpperCase() || 'U'}</div>
                        <span>{user.username}</span>
                    </div>
                    <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">My Projects</h1>
                    <p className="page-subtitle">View and manage your assigned projects</p>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>📁</div>
                        <div className="stat-info">
                            <div className="stat-value">{projects.length}</div>
                            <div className="stat-label">Total Projects</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{projects.filter(p => p.status === 'Active').length}</div>
                            <div className="stat-label">Active</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🏁</div>
                        <div className="stat-info">
                            <div className="stat-value">{projects.filter(p => p.status === 'Completed').length}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>
                </div>

                {/* Projects Table */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-title">📋 Assigned Projects</div>
                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📂</div>
                            <p>No projects assigned to you yet.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Company</th>
                                        <th>Team Lead</th>
                                        <th>Assigned Date</th>
                                        <th>Completion Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((p) => (
                                        <tr key={p._id}>
                                            <td style={{ fontWeight: 600 }}>{p.project}</td>
                                            <td>{p.company}</td>
                                            <td>{p.tl}</td>
                                            <td>{p.assigned_date || '—'}</td>
                                            <td>{p.completion_date || '—'}</td>
                                            <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                                            <td>
                                                <button
                                                    id={`view-project-${p._id}`}
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => navigate(`/project/${p._id}`)}
                                                >
                                                    👁 View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RAG Risk Panel */}
                <div className="rag-panel">
                    <div className="rag-title">🤖 AI Project Risk Analysis</div>
                    {ragSummary ? (
                        <div className="rag-response">{ragSummary}</div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
                            Click the button below to generate an AI-powered risk analysis for your project.
                        </div>
                    )}
                    <button
                        id="generate-rag-summary"
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={fetchRagSummary}
                        disabled={ragLoading || !projects.length}
                    >
                        {ragLoading ? '⏳ Analyzing...' : '🔍 Generate Risk Analysis'}
                    </button>
                </div>
            </div>
        </div>
    );
}
