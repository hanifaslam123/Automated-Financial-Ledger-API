import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { transactionsApi, Transaction } from '../api/ledgerApi';
import { format } from 'date-fns';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Posted: 'bg-[#c8f135]/10 text-[#c8f135]',
    Pending: 'bg-[#f59e0b]/10 text-[#f59e0b]',
    Voided: 'bg-[#555]/10 text-[#555] line-through',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-[#2a2a2a] text-[#555]'}`}>
      {status}
    </span>
  );
};

const TransactionsPage: React.FC = () => {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await transactionsApi.list({ pageSize: 100 });
      setTxns(data); setFiltered(data);
    } catch { setError('Failed to load transactions. Is the API running?'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      txns.filter(t =>
        t.referenceNumber?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.debitAccountName?.toLowerCase().includes(q) ||
        t.creditAccountName?.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, txns]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Transactions</h1>
          <p className="text-[#555] text-sm mt-0.5">Double-entry ledger — every transaction has a debit and a credit</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={15} /> Refresh</button>
          <Link to="/transactions/new" className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} /> New</Link>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search by reference, description, or account..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-xl text-[#ff4d4d] text-sm">⚠️ {error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide">Reference</th>
                <th className="text-left px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Debit</th>
                <th className="text-left px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Credit</th>
                <th className="text-right px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 text-[#555] font-semibold text-xs uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8f135] mx-auto" />
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-[#555]">
                  <ArrowLeftRight size={36} className="mx-auto mb-2 opacity-30" />
                  <p>{search ? 'No transactions match your search.' : 'No transactions yet.'}</p>
                  {!search && (
                    <Link to="/transactions/new" className="text-[#c8f135] hover:underline text-sm font-medium">
                      Post your first transaction →
                    </Link>
                  )}
                </td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#888] whitespace-nowrap">{t.referenceNumber}</td>
                  <td className="px-4 py-3 text-[#ccc] hidden sm:table-cell max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-debit">{t.debitAccountName}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-credit">{t.creditAccountName}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-[#c8f135] whitespace-nowrap">{fmt(t.amount)}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-right text-[#555] text-xs whitespace-nowrap">
                    {format(new Date(t.transactionDate || t.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <p className="text-sm text-[#555]">
              Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary text-xs px-3 py-1">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="btn-secondary text-xs px-3 py-1">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
