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

    useEffect(() => { fetchProject(); }, [id]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
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
                text: `👋 Hi! I'm your AI assistant for **${res.data.project}**. Ask me about risks, team composition, progress, or any recommendations.`
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
                members: (project.members || []).map(m => typeof m === 'string' ? m : m.name),
                members: project.members,
                question: userQ
            });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.response || 'No response.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ AI assistant is temporarily unavailable.' }]);
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ RAG service unavailable. Start the Python FastAPI server on port 8000.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
    };

    const suggestedQuestions = [
        'What are the main risks?',
        'How is the team performing?',
        'Any recommendations?',
    ];

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!project) return null;

    const memberCount = project.members?.length || 0;

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

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* Left Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Project Info */}
                        <div className="card animate-in">
                            <div className="card-title">📋 Project Info</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                {[
                                    ['Status', <span className={`badge ${getStatusBadge(project.status)}`}>{project.status}</span>],
                                    ['Client', project.company],
                                    ['Team Lead', `👤 ${project.tl}`],
                                    ['Deadline', project.period_alloted || '—'],
                                    ['Assigned', project.assigned_date || '—'],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                        <span style={{ fontWeight: 500 }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            {project.prob_statement && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Problem Statement</div>
                                    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{project.prob_statement}</div>
                                </div>
                            )}
                            {project.requirements && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Requirements</div>
                                    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{project.requirements}</div>
                                </div>
                            )}
                        </div>

                        {/* Team Members Card */}
                        <div className="card animate-in">
                            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                👥 Team ({memberCount})
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/project/${id}/allocation`)}
                                    style={{ fontSize: '11px' }}
                                >
                                    ⚙️ Manage
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                {project.members?.map((m, i) => {
                                    const commitColor = m.commitment === 'full' ? '#ef4444' : m.commitment === 'partial' ? '#f59e0b' : '#10b981';
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < memberCount - 1 ? '1px solid var(--border)' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.role === 'TL' ? 'var(--accent)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: m.role === 'TL' ? '#fff' : 'var(--text-primary)' }}>
                                                    {m.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.name} {m.role === 'TL' && '👑'}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Priority: {m.priority}%</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: commitColor, background: commitColor + '22', padding: '2px 7px', borderRadius: '10px' }}>
                                                {m.commitment?.toUpperCase()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Chat */}
                    <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                        <div className="card-title">🤖 AI Project Assistant</div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                            Ask about risks, team performance, progress, or get recommendations for this project.
                        </p>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{
                                    maxWidth: '85%',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap'
                                }}>
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
                                <div style={{
                                    alignSelf: 'flex-start', background: 'var(--bg-secondary)',
                                    padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                                    fontSize: '13px', color: 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                <div className="chat-msg chat-msg-ai" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                                    Analyzing...
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Suggestions */}
                        {messages.length <= 1 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 0 6px' }}>
                                {suggestedQuestions.map(q => (
                                    <button key={q} onClick={() => { setQuestion(q); }} style={{
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        borderRadius: '20px', padding: '6px 12px', fontSize: '12px',
                                        cursor: 'pointer', color: 'var(--text-primary)'
                                    }}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Ask something about this project..."
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
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleAsk}
                                disabled={chatLoading || !question.trim()}
                                style={{ padding: '0 18px', flexShrink: 0 }}
                            >
                                ➤
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
