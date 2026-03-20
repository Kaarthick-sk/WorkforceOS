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
            const res = await api.get('/api/employees');
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
            setMessage({ type: 'error', text: 'Please fill in Company, Project Name, and Team Lead.' });
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
            setMessage({ type: 'success', text: `✅ Project created successfully! Team assigned.` });
            setForm(defaultForm);
            setRagMembers([]);
            setSelectedMembers([]);
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
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="card animate-in" style={{ marginBottom: '24px' }}>
                        <div className="card-title">📁 Project Details</div>
                        <form onSubmit={handleRecommend}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Client Company *</label>
                                    <input className="form-input" type="text" name="company" value={form.company} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project Name *</label>
                                    <input className="form-input" type="text" name="project" value={form.project} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Problem Statement</label>
                                <textarea className="form-textarea" name="prob_statement" value={form.prob_statement} onChange={handleChange} rows={3} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Technical Requirements *</label>
                                <textarea className="form-textarea" name="requirements" value={form.requirements} onChange={handleChange} rows={3} required />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Deadline / Period</label>
                                    <input className="form-input" type="text" name="deadline" value={form.deadline} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Team Lead *</label>
                                    <select className="form-select" name="tl" value={form.tl} onChange={handleChange} required>
                                        <option value="">— Select Team Lead —</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp.name}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Team Lead Password *</label>
                                <input className="form-input" type="password" name="tlPassword" value={form.tlPassword} onChange={handleChange} required />
                            </div>

                            <button className="btn btn-primary" type="submit" disabled={recommending || submitting}>
                                {recommending ? '🤖 Getting Recommendations...' : '🔍 Get RAG Recommendations'}
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
