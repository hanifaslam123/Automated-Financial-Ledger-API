import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="bg-[#c8f135] p-2 rounded-xl">
            <Zap size={24} className="text-[#0e0e0e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f0f0f0]">LedgeMains</h1>
            <p className="text-xs text-[#555]">Automated Financial Ledger</p>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-[#f0f0f0] mb-1">Welcome back</h2>
          <p className="text-sm text-[#555] mb-6">Sign in to your account</p>
          {error && (
            <div className="mb-4 p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-xl text-[#ff4d4d] text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#f0f0f0]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#555] mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#c8f135] hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
