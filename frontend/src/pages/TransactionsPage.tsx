import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { transactionsApi, Transaction } from '../api/ledgerApi';
import { format } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Posted:  'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Voided:  'bg-red-100 text-red-600 line-through',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
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
      setTxns(data);
      setFiltered(data);
    } catch {
      setError('Failed to load transactions. Is the API running?');
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Double-entry ledger — every transaction has a debit and a credit</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/transactions/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> New
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search by reference, description, or account..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">⚠️ {error}</div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Reference</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden sm:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Debit Account</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Credit Account</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Amount</th>
                <th className="text-center px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">
                  <ArrowLeftRight size={36} className="mx-auto mb-2 opacity-30" />
                  <p>{search ? 'No transactions match your search.' : 'No transactions yet.'}</p>
                  {!search && (
                    <Link to="/transactions/new" className="text-blue-600 hover:underline text-sm font-medium">
                      Post your first transaction →
                    </Link>
                  )}
                </td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{t.referenceNumber}</td>
                  <td className="px-4 py-3 text-slate-700 hidden sm:table-cell max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-debit">{t.debitAccountName}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="badge-credit">{t.creditAccountName}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">{fmt(t.amount)}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                    {format(new Date(t.transactionDate || t.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-500">
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
