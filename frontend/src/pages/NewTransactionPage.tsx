import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, ArrowLeftRight } from 'lucide-react';
import { accountsApi, transactionsApi, Account } from '../api/ledgerApi';

const NewTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    debitAccountId: '', creditAccountId: '', amount: '', description: '', currency: 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [refNum, setRefNum] = useState('');

  useEffect(() => {
    accountsApi.list()
      .then(setAccounts)
      .catch(() => setError('Could not load accounts. Is the API running?'))
      .finally(() => setLoadingAccounts(false));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.debitAccountId === form.creditAccountId) { setError('Debit and Credit accounts must be different.'); return; }
    if (parseFloat(form.amount) <= 0) { setError('Amount must be greater than zero.'); return; }
    setLoading(true);
    try {
      const txn = await transactionsApi.create({
        debitAccountId: parseInt(form.debitAccountId),
        creditAccountId: parseInt(form.creditAccountId),
        amount: parseFloat(form.amount),
        description: form.description,
        currency: form.currency,
      });
      setRefNum(txn.referenceNumber);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Transaction failed. Please check account selection and amount.');
    } finally { setLoading(false); }
  };

  const debitAccount = accounts.find(a => a.id === parseInt(form.debitAccountId));
  const creditAccount = accounts.find(a => a.id === parseInt(form.creditAccountId));

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c8f135]/10 rounded-full mx-auto">
            <CheckCircle size={32} className="text-[#c8f135]" />
          </div>
          <h2 className="text-xl font-bold text-[#f0f0f0]">Transaction Posted!</h2>
          <p className="text-[#888] text-sm">
            Reference: <span className="font-mono font-semibold text-[#c8f135]">{refNum}</span>
          </p>
          <p className="text-[#555] text-sm">
            The double-entry transaction has been recorded with 100% data accuracy.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => { setSuccess(false); setForm({ debitAccountId: '', creditAccountId: '', amount: '', description: '', currency: 'USD' }); }}
              className="btn-secondary text-sm"
            >
              New Transaction
            </button>
            <Link to="/transactions" className="btn-primary text-sm">View All Transactions</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/transactions" className="inline-flex items-center gap-1 text-sm text-[#555] hover:text-[#f0f0f0] mb-3">
          <ArrowLeft size={15} /> Back to Transactions
        </Link>
        <h1 className="text-2xl font-bold text-[#f0f0f0]">New Transaction</h1>
        <p className="text-[#555] text-sm mt-0.5">
          All transactions follow double-entry accounting: every debit must have an equal credit.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-xl text-[#ff4d4d] text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#ff4d4d]/5 border border-[#ff4d4d]/20 rounded-xl">
            <p className="text-xs font-bold text-[#ff4d4d] uppercase tracking-wider mb-2">← Debit (From)</p>
            <label className="label text-xs">Account</label>
            <select className="input text-sm" value={form.debitAccountId} onChange={set('debitAccountId')} required disabled={loadingAccounts}>
              <option value="">Select account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === parseInt(form.creditAccountId)}>
                  {a.accountNumber} — {a.accountName} ({a.accountType})
                </option>
              ))}
            </select>
            {debitAccount && (
              <p className="text-xs text-[#ff4d4d] mt-1 font-medium">
                Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: debitAccount.currency }).format(debitAccount.balance)}
              </p>
            )}
          </div>

          <div className="p-4 bg-[#c8f135]/5 border border-[#c8f135]/20 rounded-xl">
            <p className="text-xs font-bold text-[#c8f135] uppercase tracking-wider mb-2">Credit (To) →</p>
            <label className="label text-xs">Account</label>
            <select className="input text-sm" value={form.creditAccountId} onChange={set('creditAccountId')} required disabled={loadingAccounts}>
              <option value="">Select account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === parseInt(form.debitAccountId)}>
                  {a.accountNumber} — {a.accountName} ({a.accountType})
                </option>
              ))}
            </select>
            {creditAccount && (
              <p className="text-xs text-[#c8f135] mt-1 font-medium">
                Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: creditAccount.currency }).format(creditAccount.balance)}
              </p>
            )}
          </div>
        </div>

        {form.debitAccountId && form.creditAccountId && form.amount && (
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="badge-debit px-4">DR {form.amount}</span>
            <ArrowLeftRight size={18} className="text-[#555]" />
            <span className="badge-credit px-4">CR {form.amount}</span>
            <span className="text-xs text-[#c8f135] font-semibold ml-1">✓ Balanced</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm">$</span>
              <input type="number" className="input pl-7" placeholder="0.00" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required />
            </div>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currency} onChange={set('currency')}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Describe this transaction (e.g. Office supplies purchase, Invoice #1234)..."
            value={form.description}
            onChange={set('description')}
            required
            maxLength={500}
          />
          <p className="text-xs text-[#555] mt-1 text-right">{form.description.length}/500</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Link to="/transactions" className="btn-secondary flex-1 text-center text-sm">Cancel</Link>
          <button type="submit" disabled={loading || loadingAccounts} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Posting...</> : 'Post Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTransactionPage;
