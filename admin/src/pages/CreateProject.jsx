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
    const [ragResult, setRagResult] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { fetchEmployees(); }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/api/employees');
            setEmployees(res.data);
            // Sync employees to RAG service
            if (res.data.length > 0) {
                try {
                    await fetch(`${import.meta.env.VITE_RAG_API || 'http://localhost:8000'}/load-employees`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(res.data)
                    });
                } catch { }
            }
        } catch { }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setRagResult(null);
        try {
            const res = await api.post('/api/projects', form);
            setRagResult(res.data);
            setMessage({ type: 'success', text: `✅ Project "${form.project}" created! TL login: ${res.data.tlCredentials?.username}` });
            setForm(defaultForm);
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
                        <p className="page-subtitle">Fill in project details — the AI will recommend the best team members</p>
                    </div>

                    {message && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="card animate-in" style={{ marginBottom: '24px' }}>
                        <div className="card-title">📁 Project Details</div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="proj-company">Client Company *</label>
                                    <input id="proj-company" className="form-input" type="text" name="company"
                                        placeholder="e.g. Acme Corporation" value={form.company} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="proj-name">Project Name *</label>
                                    <input id="proj-name" className="form-input" type="text" name="project"
                                        placeholder="e.g. E-Commerce Platform v2" value={form.project} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="proj-problem">Problem Statement *</label>
                                <textarea id="proj-problem" className="form-textarea" name="prob_statement"
                                    placeholder="Describe the core business problem this project solves..."
                                    value={form.prob_statement} onChange={handleChange} rows={4} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="proj-requirements">Technical Requirements *</label>
                                <textarea id="proj-requirements" className="form-textarea" name="requirements"
                                    placeholder="e.g. React frontend, Node.js backend, payment integration, real-time notifications..."
                                    value={form.requirements} onChange={handleChange} rows={4} required />
                                <div className="form-hint">💡 The AI uses these requirements to recommend the best team members.</div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="proj-deadline">Deadline / Period</label>
                                    <input id="proj-deadline" className="form-input" type="text" name="deadline"
                                        placeholder="e.g. 3 months, 2026-06-30" value={form.deadline} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="proj-tl">Team Lead *</label>
                                    {employees.length > 0 ? (
                                        <select id="proj-tl" className="form-select" name="tl" value={form.tl} onChange={handleChange} required>
                                            <option value="">— Select Team Lead —</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp.name}>{emp.name} ({emp.role || 'No Role'})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input id="proj-tl" className="form-input" type="text" name="tl"
                                            placeholder="Team Lead name (add employees first)" value={form.tl} onChange={handleChange} required />
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="proj-tl-password">Team Lead Login Password *</label>
                                <input id="proj-tl-password" className="form-input" type="password" name="tlPassword"
                                    placeholder="Set a login password for the TL" value={form.tlPassword} onChange={handleChange} required />
                                <div className="form-hint">🔐 A user account will be created for the Team Lead with this password.</div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button id="create-project-btn" className="btn btn-primary" type="submit" disabled={submitting}>
                                    {submitting ? '🤖 AI Recommending Team...' : '🚀 Create Project + Recommend Team'}
                                </button>
                                {submitting && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    The RAG engine is analyzing employee skills...
                                </span>}
                            </div>
                        </form>
                    </div>

                    {/* RAG Result */}
                    {ragResult && (
                        <div className="rag-result-box animate-in">
                            <h4>🤖 AI Team Recommendation</h4>
                            {ragResult.recommendedMembers?.length > 0 ? (
                                <>
                                    <p style={{ marginBottom: '10px' }}>The RAG engine recommended the following team members based on skills and experience:</p>
                                    <ul>
                                        {ragResult.recommendedMembers.map((m, i) => <li key={i}>👤 {m}</li>)}
                                    </ul>
                                    {ragResult.project?.members && (
                                        <p style={{ marginTop: '10px', color: 'var(--success)' }}>
                                            ✅ {ragResult.recommendedMembers.length} members assigned to the project.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>⚠️ No employees found in RAG index. Add employees first and ensure the Python RAG service is running.</p>
                            )}
                            {ragResult.tlCredentials && (
                                <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        🔑 <strong>TL Login Created:</strong> Username: <code style={{ color: '#a5b4fc' }}>{ragResult.tlCredentials.username}</code>
                                        <br />Share this username and the set password with the Team Lead.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
