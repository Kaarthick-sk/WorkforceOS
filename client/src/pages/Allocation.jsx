import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function getCommitmentBadge(lvl) {
    if (lvl === 'full') return { label: 'FULL', color: '#ef4444' }; // Red
    if (lvl === 'partial') return { label: 'PARTIAL', color: '#f59e0b' }; // Yellow
    return { label: 'VERY LESS', color: '#10b981' }; // Green
}

export default function Allocation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => { fetchProject(); }, [id]);

    const fetchProject = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/projects/${id}`);
            setProject(res.data);
        } catch {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleMemberChange = (index, field, value) => {
        const updated = [...project.members];
        updated[index] = { ...updated[index], [field]: value };
        setProject({ ...project, members: updated });
        setSaved(false);
    };

    const saveAllocation = async () => {
        setSaving(true);
        try {
            await api.put(`/api/projects/${id}/allocation`, { members: project.members });
            setSaved(true);
        } catch {
            alert('❌ Failed to save allocation.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!project) return null;

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <a className="navbar-brand" href="/dashboard">
                    <div className="brand-icon">🏢</div>
                    WorkforceOS
                </a>
                <div className="navbar-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => { localStorage.clear(); navigate('/'); }}>
                        🚪 Logout
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <a className="back-link" onClick={() => navigate(`/project/${id}`)} style={{ cursor: 'pointer' }}>
                    ← Back to Project
                </a>

                <div className="page-header">
                    <h1 className="page-title">📊 Team Allocation</h1>
                    <p className="page-subtitle">{project.project} — {project.company}</p>
                </div>

                <div className="card animate-in" style={{ maxWidth: '800px' }}>
                    <div className="card-title">
                        Manage Member Priorities & Commitment
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {project.members?.length} members
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {project.members?.map((m, i) => {
                            const badge = getCommitmentBadge(m.commitment);
                            return (
                                <div key={i} style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: '50%',
                                                background: 'var(--accent)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '14px', color: '#fff'
                                            }}>
                                                {m.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {m.role === 'TL' ? '👑 Team Lead' : 'Team Member'}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                                            fontWeight: 700, background: badge.color + '22', color: badge.color
                                        }}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Controls */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        {/* Priority Slider */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    Priority
                                                </label>
                                                <span style={{
                                                    fontSize: '12px', fontWeight: 700, color: 'var(--accent)',
                                                    background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: '10px'
                                                }}>
                                                    {m.priority}%
                                                </span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" value={m.priority}
                                                style={{ width: '100%', accentColor: 'var(--accent)' }}
                                                onChange={(e) => handleMemberChange(i, 'priority', parseInt(e.target.value))}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                                                <span>0%</span><span>100%</span>
                                            </div>
                                        </div>

                                        {/* Commitment Dropdown */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                                                Commitment Level
                                            </label>
                                            {m.role === 'TL' ? (
                                                <div style={{
                                                    padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                                                    borderRadius: '8px', fontSize: '13px', color: '#ef4444', fontWeight: 600
                                                }}>
                                                    🔒 Full (fixed for TL)
                                                </div>
                                            ) : (
                                                <select
                                                    className="form-select"
                                                    value={m.commitment}
                                                    onChange={(e) => handleMemberChange(i, 'commitment', e.target.value)}
                                                    style={{ width: '100%' }}
                                                >
                                                    <option value="full">🔴 Full</option>
                                                    <option value="partial">🟡 Partial</option>
                                                    <option value="very_less">🟢 VERY LESS</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={saveAllocation}
                            disabled={saving}
                        >
                            {saving ? '⏳ Saving...' : '💾 Save Allocation'}
                        </button>
                        {saved && (
                            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
                                ✅ Saved!
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
