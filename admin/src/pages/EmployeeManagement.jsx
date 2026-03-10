import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const defaultForm = {
    name: '', email: '', skills: '', experience: '', role: '', availability: 'Available', past_projects: ''
};

export default function EmployeeManagement() {
    const [form, setForm] = useState(defaultForm);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { fetchEmployees(); }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/employees');
            setEmployees(res.data);
        } catch { setEmployees([]); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        try {
            await api.post('/api/employees', { ...form, experience: Number(form.experience) });
            setMessage({ type: 'success', text: `✅ Employee "${form.name}" added successfully!` });
            setForm(defaultForm);
            fetchEmployees();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || '❌ Failed to add employee.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete employee "${name}"?`)) return;
        try {
            await api.delete(`/api/employees/${id}`);
            setEmployees(prev => prev.filter(e => e._id !== id));
            setMessage({ type: 'success', text: `✅ Employee "${name}" removed.` });
        } catch {
            setMessage({ type: 'error', text: '❌ Failed to delete employee.' });
        }
    };

    const getAvailBadge = (a) => a === 'Available' ? 'badge-success' : a === 'Busy' ? 'badge-warning' : 'badge-danger';

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
                <div className="admin-topbar">
                    <span className="topbar-title">Employee Management</span>
                    <div className="topbar-right">
                        <span className="admin-badge">👥 {employees.length} Employees</span>
                    </div>
                </div>

                <div className="admin-content">
                    <div className="page-header">
                        <h1 className="page-title">Employee Management</h1>
                        <p className="page-subtitle">Add and manage your workforce team members</p>
                    </div>

                    {/* Add Employee Form */}
                    <div className="card animate-in" style={{ marginBottom: '24px' }}>
                        <div className="card-title">➕ Add New Employee</div>

                        {message && (
                            <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="emp-name">Full Name *</label>
                                    <input id="emp-name" className="form-input" type="text" name="name"
                                        placeholder="e.g. John Smith" value={form.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="emp-email">Email Address *</label>
                                    <input id="emp-email" className="form-input" type="email" name="email"
                                        placeholder="e.g. john@company.com" value={form.email} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="emp-skills">Skills</label>
                                    <input id="emp-skills" className="form-input" type="text" name="skills"
                                        placeholder="e.g. React, Node.js, Python, AI/ML" value={form.skills} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="emp-experience">Experience (Years)</label>
                                    <input id="emp-experience" className="form-input" type="number" name="experience"
                                        placeholder="e.g. 3" min="0" max="50" value={form.experience} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="emp-role">Role / Designation</label>
                                    <input id="emp-role" className="form-input" type="text" name="role"
                                        placeholder="e.g. Full Stack Developer" value={form.role} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="emp-availability">Availability</label>
                                    <select id="emp-availability" className="form-select" name="availability"
                                        value={form.availability} onChange={handleChange}>
                                        <option>Available</option>
                                        <option>Busy</option>
                                        <option>On Leave</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="emp-past-projects">Past Projects</label>
                                <textarea id="emp-past-projects" className="form-textarea" name="past_projects"
                                    placeholder="Brief description of previous projects and contributions..."
                                    value={form.past_projects} onChange={handleChange} rows={3} />
                            </div>

                            <button id="add-employee-btn" className="btn btn-primary" type="submit" disabled={submitting}>
                                {submitting ? '⏳ Adding...' : '➕ Add Employee'}
                            </button>
                        </form>
                    </div>

                    {/* Employee List */}
                    <div className="card animate-in">
                        <div className="card-title">👥 Employee Directory ({employees.length})</div>
                        {loading ? (
                            <div className="loading"><div className="spinner"></div></div>
                        ) : employees.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👤</div>
                                <p>No employees added yet. Use the form above to add team members.</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Skills</th>
                                            <th>Experience</th>
                                            <th>Role</th>
                                            <th>Availability</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, i) => (
                                            <tr key={emp._id}>
                                                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                                                <td>
                                                    {emp.skills?.split(',').slice(0, 3).map((s, idx) => (
                                                        <span key={idx} className="badge badge-info" style={{ marginRight: 4 }}>{s.trim()}</span>
                                                    ))}
                                                </td>
                                                <td>{emp.experience} yr{emp.experience !== 1 ? 's' : ''}</td>
                                                <td>{emp.role || '—'}</td>
                                                <td><span className={`badge ${getAvailBadge(emp.availability)}`}>{emp.availability}</span></td>
                                                <td>
                                                    <button
                                                        id={`delete-emp-${emp._id}`}
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(emp._id, emp.name)}
                                                    >
                                                        🗑 Remove
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
