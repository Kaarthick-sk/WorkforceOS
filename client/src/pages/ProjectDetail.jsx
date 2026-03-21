import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChartRenderer from '../components/ChartRenderer';

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
    const chatContainerRef = useRef(null);

    useEffect(() => { fetchProject(); }, [id]);
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchProject = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/projects/${id}`);
            setProject(res.data);
            setMessages([{
                role: 'ai',
                text: `👋 Hi! I'm your AI assistant for **${res.data.project}**. Ask me about risks, team composition, progress, or any recommendations.`
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
                question: userQ
            });
            
            const data = res.data;
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: data.response || 'No response.',
                type: data.type || 'text',
                chart: data.chart || (data.type === 'chart' ? { chartType: data.chartType, data: data.data, title: data.title } : null)
            }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ AI assistant is temporarily unavailable.' }]);
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
                                {project.members?.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < memberCount - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.role === 'TL' ? 'var(--accent)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: m.role === 'TL' ? '#fff' : 'var(--text-primary)' }}>
                                                {m.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.role === 'TL' ? '👑 Team Lead' : 'Team Member'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Chat */}
                    <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', height: '550px', position: 'relative' }}>
                        <div className="card-title">🤖 AI Project Assistant</div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                            Ask about risks, team performance, progress, or get recommendations.
                        </p>

                        {/* Messages Container */}
                        <div id="chat-container" ref={chatContainerRef} style={{ 
                            height: '400px', 
                            overflowY: 'auto', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px', 
                            padding: '12px',
                            background: 'rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            marginBottom: '12px'
                        }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{
                                    maxWidth: '90%',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}>
                                    {/* Text Content */}
                                    {msg.text && <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>}

                                    {/* Chart Content */}
                                    {(msg.type === 'chart' || msg.type === 'mixed') && msg.chart && (
                                        <ChartRenderer 
                                            chartType={msg.chart.chartType} 
                                            data={msg.chart.data} 
                                            title={msg.chart.title} 
                                        />
                                    )}
                                </div>
                            ))}
                            {chatLoading && (
                                <div style={{
                                    alignSelf: 'flex-start', background: 'var(--bg-secondary)',
                                    padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                                    fontSize: '13px', color: 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                                    Analyzing...
                                </div>
                            )}
                        </div>

                        {/* Input Area (Fixed at bottom of card) */}
                        <div style={{ marginTop: 'auto' }}>
                            {/* Suggestions */}
                            {messages.length <= 1 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                    {suggestedQuestions.map(q => (
                                        <button key={q} onClick={() => { setQuestion(q); }} style={{
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                            borderRadius: '16px', padding: '5px 10px', fontSize: '11px',
                                            cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s'
                                        }}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                <input
                                    id="project-question-input"
                                    className="form-input"
                                    type="text"
                                    placeholder="Ask something..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={chatLoading}
                                    style={{ flex: 1, height: '40px' }}
                                />
                                <button
                                    id="send-question-btn"
                                    className="btn btn-primary"
                                    onClick={handleAsk}
                                    disabled={chatLoading || !question.trim()}
                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
