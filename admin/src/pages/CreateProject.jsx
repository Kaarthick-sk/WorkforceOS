import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const defaultForm = {
    company: '', project: '', prob_statement: '', requirements: '', deadline: '', tl: '', tlPassword: ''
};

export default function CreateProject() {
    const [form, setForm] = useState(defaultForm);
    const [employees, setEmployees] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [ragMembers, setRagMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [recommending, setRecommending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchEmployees(); }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/api/employees?eligible_tl=true');
            setEmployees(res.data);
            // Sync employees to RAG
            try {
                await fetch(`${import.meta.env.VITE_RAG_API || 'http://localhost:8000'}/load-employees`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(res.data)
                });
            } catch { }
        } catch { }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRecommend = async (e) => {
        e.preventDefault();
        if (!form.company || !form.project || !form.tl) {
            setMessage({ type: 'error', text: 'Please fill in Client Company, Project Name, and select a Team Lead.' });
            return;
        }
        setRecommending(true);
        setMessage(null);
        try {
            const res = await api.post('/api/projects/recommend', {
                requirements: form.requirements,
                deadline: form.deadline
            });
            setRagMembers(res.data.recommended_members || []);
            setSelectedMembers(res.data.recommended_members || []);
            setMessage({ type: 'success', text: '🤖 Team recommendations ready! Review and adjust below.' });
        } catch (err) {
            setMessage({ type: 'error', text: '❌ Failed to get recommendations.' });
        } finally {
            setRecommending(false);
        }
    };

    const handleAddMember = (e) => {
        const name = e.target.value;
        if (name && !selectedMembers.includes(name)) {
            setSelectedMembers([...selectedMembers, name]);
        }
        e.target.value = "";
    };

    const handleRemoveMember = (name) => {
        setSelectedMembers(selectedMembers.filter(m => m !== name));
    };

    const handleAssignTeam = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/api/projects', {
                ...form,
                members: selectedMembers.map(m => ({ name: m }))
            });
            
            const tlUser = res.data.tlCredentials.username;
            const tlPass = form.tlPassword;

            setMessage({ 
                type: 'success', 
                text: 'Project Created Successfully',
                details: {
                    title: 'Team Lead Created Successfully',
                    username: tlUser,
                    password: tlPass
                }
            });
            setForm(defaultForm);
            setRagMembers([]);
            setSelectedMembers([]);
            fetchEmployees(); // Refresh eligible TLs
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || '❌ Failed to create project.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <div className="admin-topbar">
                    <span className="topbar-title">Create New Project</span>
                    <div className="topbar-right">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
                            📋 View All Projects
                        </button>
                    </div>
                </div>

                <div className="admin-content">
                    <div className="page-header">
                        <h1 className="page-title">Create New Project</h1>
                        <p className="page-subtitle">Standardize your workforce allocation with AI-driven recommendations</p>
                    </div>

                    {message && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ padding: '20px', marginBottom: '24px' }}>
                            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: message.details ? '12px' : '0' }}>{message.text}</div>
                            {message.details && (
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '8px' }}>{message.details.title}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '14px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Username:</span>
                                        <strong style={{ letterSpacing: '0.5px' }}>{message.details.username}</strong>
                                        <span style={{ color: 'var(--text-muted)' }}>Password:</span>
                                        <strong style={{ letterSpacing: '0.5px' }}>{message.details.password}</strong>
                                    </div>
                                    <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>Please share these credentials with the assigned Team Lead.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card animate-in" style={{ marginBottom: '24px', padding: '24px' }}>
                        <div className="card-title" style={{ marginBottom: '20px' }}>📁 Project Details</div>
                        <form onSubmit={handleRecommend}>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Client Company *</label>
                                    <input className="form-input" type="text" name="company" placeholder="Enter client company name" value={form.company} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Project Name *</label>
                                    <input className="form-input" type="text" name="project" placeholder="Enter project name" value={form.project} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Problem Statement</label>
                                <textarea className="form-textarea" name="prob_statement" placeholder="Describe the project goal or problem statement" value={form.prob_statement} onChange={handleChange} rows={3} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Technical Requirements *</label>
                                <textarea className="form-textarea" name="requirements" placeholder="Describe project technical requirements (e.g. React, Node.js, Python)" value={form.requirements} onChange={handleChange} rows={3} required />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Deadline / Period</label>
                                    <input className="form-input" type="text" name="deadline" placeholder="Select deadline date or period" value={form.deadline} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Team Lead *</label>
                                    <select className="form-select" name="tl" value={form.tl} onChange={handleChange} required>
                                        <option value="">— Select Eligible Team Lead —</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp.name}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Team Lead Login Password *</label>
                                <input className="form-input" type="password" name="tlPassword" placeholder="Set password for Team Lead login" value={form.tlPassword} onChange={handleChange} required />
                            </div>

                            <button className="btn btn-primary" type="submit" disabled={recommending || submitting} style={{ padding: '12px 24px', fontWeight: 600 }}>
                                {recommending ? '🤖 Generating Recommendations...' : '🔍 Get AI Recommendations'}
                            </button>
                        </form>
                    </div>

                    {/* PART 1 & 9: TEAM VERIFICATION UI */}
                    {(ragMembers.length > 0 || selectedMembers.length > 0) && (
                        <div className="card animate-in" style={{ borderColor: 'var(--primary)' }}>
                            <div className="card-title">👥 Verify & Assign Team</div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Review AI recommendations. Add or remove members manually if needed.
                            </p>

                            <div className="team-review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                {selectedMembers.map(name => (
                                    <div key={name} className="member-tag" style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <span>👤 {name}</span>
                                        <button className="btn-icon" onClick={() => handleRemoveMember(name)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                    </div>
                                ))}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Add Member Manually</label>
                                <select className="form-select" onChange={handleAddMember} value="">
                                    <option value="">— Choose Employee —</option>
                                    {employees.filter(e => e.name !== form.tl && !selectedMembers.includes(e.name)).map(emp => (
                                        <option key={emp._id} value={emp.name}>{emp.name} ({emp.role || 'Member'})</option>
                                    ))}
                                </select>
                            </div>

                            <button className="btn btn-success" onClick={handleAssignTeam} disabled={submitting} style={{ marginTop: '10px', width: '100%' }}>
                                {submitting ? 'Saving...' : '✅ Assign Team & Create Project'}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
