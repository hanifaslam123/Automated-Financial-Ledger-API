import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, BookOpen, Loader2, X } from 'lucide-react';
import { accountsApi, Account, AccountType, CreateAccountDto } from '../api/ledgerApi';

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

const TYPE_COLORS: Record<string, string> = {
  Asset: 'bg-[#c8f135]/10 text-[#c8f135]',
  Liability: 'bg-[#ff4d4d]/10 text-[#ff4d4d]',
  Equity: 'bg-[#3b82f6]/10 text-[#3b82f6]',
  Revenue: 'bg-[#22c55e]/10 text-[#22c55e]',
  Expense: 'bg-[#f59e0b]/10 text-[#f59e0b]',
};

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateAccountDto>({
    accountNumber: '', accountName: '', accountType: 'Asset', currency: 'USD',
  });

  const load = async () => {
    setLoading(true); setError('');
    try { setAccounts(await accountsApi.list()); }
    catch { setError('Failed to load accounts. Is the API running?'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await accountsApi.create(form);
      setShowForm(false);
      setForm({ accountNumber: '', accountName: '', accountType: 'Asset', currency: 'USD' });
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create account.');
    } finally { setSubmitting(false); }
  };

  const grouped = (Object.keys(TYPE_COLORS) as AccountType[]).map(type => ({
    type,
    accounts: accounts.filter(a => a.accountType === type),
    total: accounts.filter(a => a.accountType === type).reduce((sum, a) => sum + a.balance, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Chart of Accounts</h1>
          <p className="text-[#555] text-sm mt-0.5">ACID-compliant account structure — EF Core managed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} /> New Account</button>
        </div>
      </div>

      {error && <div className="p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-xl text-[#ff4d4d] text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#f0f0f0]">Create Account</h2>
              <button onClick={() => setShowForm(false)} className="text-[#555] hover:text-[#f0f0f0]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Account Number</label>
                <input className="input" placeholder="e.g. 1010" value={form.accountNumber} onChange={set('accountNumber')} required />
              </div>
              <div>
                <label className="label">Account Name</label>
                <input className="input" placeholder="e.g. Cash and Cash Equivalents" value={form.accountName} onChange={set('accountName')} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.accountType} onChange={set('accountType')}>
                    {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={set('currency')}>
                    <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8f135]" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, accounts: accs, total }) => (
            accs.length > 0 && (
              <div key={type} className="card p-0 overflow-hidden">
                <div className="px-5 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[type]}`}>{type}</span>
                    <span className="text-sm text-[#555]">{accs.length} account{accs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#f0f0f0]">Total: {fmt(total)}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-2.5 text-[#555] font-medium text-xs uppercase tracking-wide">Account #</th>
                      <th className="text-left px-5 py-2.5 text-[#555] font-medium text-xs uppercase tracking-wide">Name</th>
                      <th className="text-center px-5 py-2.5 text-[#555] font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Currency</th>
                      <th className="text-right px-5 py-2.5 text-[#555] font-medium text-xs uppercase tracking-wide">Balance</th>
                      <th className="text-center px-5 py-2.5 text-[#555] font-medium text-xs uppercase tracking-wide hidden md:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accs.map(a => (
                      <tr key={a.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-[#888]">{a.accountNumber}</td>
                        <td className="px-5 py-3 text-[#f0f0f0] font-medium">{a.accountName}</td>
                        <td className="px-5 py-3 text-center text-[#555] hidden sm:table-cell">{a.currency}</td>
                        <td className={`px-5 py-3 text-right font-semibold ${a.balance >= 0 ? 'text-[#c8f135]' : 'text-[#ff4d4d]'}`}>
                          {fmt(a.balance, a.currency)}
                        </td>
                        <td className="px-5 py-3 text-center hidden md:table-cell">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${a.isActive ? 'bg-[#c8f135]/10 text-[#c8f135]' : 'bg-[#2a2a2a] text-[#555]'}`}>
                            {a.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-16 text-[#555]">
              <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
              <p>No accounts yet.</p>
              <button onClick={() => setShowForm(true)} className="text-[#c8f135] hover:underline text-sm font-medium mt-1">
                Create your first account →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
