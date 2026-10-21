import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(email, password);
      setAuth(data.access_token);
      addToast('Welcome back!', 'success');
      navigate('/documents');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Login failed';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DocMind AI
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to chat with your documents</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)', color: '#fff' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--accent-light)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
