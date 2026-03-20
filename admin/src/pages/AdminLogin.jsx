import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid credentials.');
            }
        } catch (err) {
            setError('Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">⚙️</div>
                    <span className="login-title">HR/Admin Panel</span>
                </div>
                <p className="login-subtitle">Workforce Management System — HR/Admin Access</p>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label" htmlFor="admin-username">Username</label>
                        <input
                            id="admin-username"
                            className="form-input"
                            type="text"
                            name="username"
                            placeholder="Enter your username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" htmlFor="admin-password">Password</label>
                        <input
                            id="admin-password"
                            className="form-input"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        id="admin-login-submit"
                        className="btn btn-primary btn-full"
                        type="submit"
                        disabled={loading}
                        style={{ padding: '12px', fontWeight: 600 }}
                    >
                        {loading ? '🔄 Authenticating...' : '🔐 Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
