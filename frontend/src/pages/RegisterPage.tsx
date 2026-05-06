import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form.email, form.password, form.username);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally { setLoading(false); }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

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
          <h2 className="text-lg font-bold text-[#f0f0f0] mb-1">Create account</h2>
          <p className="text-sm text-[#555] mb-6">Get started with LedgeMains</p>
          {error && (
            <div className="mb-4 p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-xl text-[#ff4d4d] text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="johndoe" value={form.username} onChange={set('username')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#555] mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-[#c8f135] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
