import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useToast } from '../contexts/ToastContext';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
      addToast('Account created! Please sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Registration failed';
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
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Start chatting with your documents</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              id="register-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)', color: '#fff' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--accent-light)' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
