import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function getStatusBadge(status) {
    const map = { Active: 'badge-success', Completed: 'badge-info', 'On Hold': 'badge-warning', Cancelled: 'badge-danger' };
    return map[status] || 'badge-info';
}

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchProject();
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchProject = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/projects/${id}`);
            setProject(res.data);
            setMessages([{
                role: 'ai',
                text: `👋 Project loaded! I'm your AI assistant for **${res.data.project}**. Ask me anything about risks, team composition, progress, or recommendations.`
            }]);
        } catch {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleAsk = async () => {
        if (!question.trim() || !project) return;
        const userQ = question.trim();
        setMessages(prev => [...prev, { role: 'user', text: userQ }]);
        setQuestion('');
        setChatLoading(true);
        try {
            const res = await api.post('/api/rag/analyze-project', {
                project_name: project.project,
                company: project.company,
                prob_statement: project.prob_statement,
                requirements: project.requirements,
                members: project.members,
                question: userQ
            });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.response || 'No response.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ RAG service unavailable. Start the Python FastAPI server on port 8000.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
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
                    <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={() => { localStorage.clear(); navigate('/'); }}>
                        🚪 Logout
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <a className="back-link" href="/dashboard">← Back to Dashboard</a>

                <div className="page-header">
                    <h1 className="page-title">{project.project}</h1>
                    <p className="page-subtitle">{project.company}</p>
                </div>

                {/* Project Info Card */}
                <div className="card animate-in" style={{ marginBottom: '24px' }}>
                    <div className="card-title">📋 Project Information</div>
                    <div className="info-grid">
                        <div className="info-field">
                            <div className="info-label">Project Name</div>
                            <div className="info-value">{project.project}</div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Client Company</div>
                            <div className="info-value">{project.company}</div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Team Lead</div>
                            <div className="info-value">👤 {project.tl}</div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Assigned Date</div>
                            <div className="info-value">{project.assigned_date || '—'}</div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Period Allotted</div>
                            <div className="info-value">{project.period_alloted || '—'}</div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Completion Date</div>
                            <div className="info-value">{project.completion_date || '—'}</div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Status</div>
                            <div className="info-value">
                                <span className={`badge ${getStatusBadge(project.status)}`}>{project.status}</span>
                            </div>
                        </div>
                        <div className="info-field">
                            <div className="info-label">Team Members</div>
                            <div className="info-value">
                                {project.members?.length > 0
                                    ? project.members.map((m, i) => (
                                        <span key={i} className="badge badge-purple" style={{ marginRight: 4, marginBottom: 4 }}>👤 {m}</span>
                                    ))
                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                }
                            </div>
                        </div>
                    </div>

                    {project.prob_statement && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="info-label">Problem Statement</div>
                            <div style={{
                                marginTop: '8px', padding: '14px 16px',
                                background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                                fontSize: '13px', lineHeight: '1.7'
                            }}>
                                {project.prob_statement}
                            </div>
                        </div>
                    )}

                    {project.requirements && (
                        <div style={{ marginTop: '16px' }}>
                            <div className="info-label">Requirements</div>
                            <div style={{
                                marginTop: '8px', padding: '14px 16px',
                                background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                                fontSize: '13px', lineHeight: '1.7'
                            }}>
                                {project.requirements}
                            </div>
                        </div>
                    )}
                </div>

                {/* RAG Chat */}
                <div className="card animate-in">
                    <div className="card-title">🤖 AI Project Assistant</div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Ask about risks, team performance, progress, or get recommendations for this project.
                    </p>

                    <div className="chat-container">
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
                                    {msg.text}
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="chat-msg chat-msg-ai" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                                    Analyzing...
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="chat-input-row">
                            <input
                                id="project-question-input"
                                className="form-input"
                                type="text"
                                placeholder="Ask about this project (e.g. What are the risks?)"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={chatLoading}
                            />
                            <button
                                id="send-question-btn"
                                className="btn btn-primary"
                                onClick={handleAsk}
                                disabled={chatLoading || !question.trim()}
                            >
                                Send ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
