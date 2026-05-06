import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight, Plus, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardApi, transactionsApi, DashboardSummary, Transaction } from '../api/ledgerApi';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const COLORS = ['#c8f135', '#22c55e', '#3b82f6', '#f59e0b', '#ff4d4d'];

const StatCard: React.FC<{
  title: string; value: string; icon: React.ElementType;
  change?: number; accentColor: string;
}> = ({ title, value, icon: Icon, change, accentColor }) => (
  <div className="stat-card">
    <div>
      <p className="text-xs text-[#555] font-semibold uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-[#f0f0f0] mt-1">{value}</p>
      {change !== undefined && (
        <p className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${change >= 0 ? 'text-[#c8f135]' : 'text-[#ff4d4d]'}`}>
          {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(change).toFixed(1)}% vs last month
        </p>
      )}
    </div>
    <div className="p-3 rounded-xl" style={{ backgroundColor: `${accentColor}15` }}>
      <Icon size={22} style={{ color: accentColor }} />
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [s, t] = await Promise.all([dashboardApi.summary(), transactionsApi.list({ pageSize: 8 })]);
      setSummary(s); setTxns(t);
    } catch { setError('Could not load dashboard. Make sure the API is running.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const chartData = txns.slice(0, 7).reverse().map(t => ({
    date: format(new Date(t.transactionDate || t.createdAt), 'MMM d'),
    amount: t.amount,
  }));

  const pieData = summary
    ? [
        { name: 'Assets', value: summary.totalAssets },
        { name: 'Revenue', value: summary.totalRevenue },
        { name: 'Equity', value: summary.totalEquity },
        { name: 'Liabilities', value: summary.totalLiabilities },
        { name: 'Expenses', value: summary.totalExpenses },
      ].filter(d => d.value > 0)
    : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c8f135]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Welcome back, {user?.username} 👋</h1>
          <p className="text-[#555] text-sm mt-0.5">Here's your financial overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2"><RefreshCw size={15} /> Refresh</button>
          <Link to="/transactions/new" className="btn-primary flex items-center gap-2"><Plus size={15} /> New Entry</Link>
        </div>
      </div>
      {error && (
        <div className="p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-xl text-[#ff4d4d] text-sm">⚠️ {error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={fmt(summary?.totalAssets ?? 0)} icon={Wallet} accentColor="#c8f135" />
        <StatCard title="Total Revenue" value={fmt(summary?.totalRevenue ?? 0)} icon={TrendingUp} accentColor="#22c55e" />
        <StatCard title="Total Expenses" value={fmt(summary?.totalExpenses ?? 0)} icon={TrendingDown} accentColor="#ff4d4d" />
        <StatCard title="Transactions" value={(summary?.transactionCount ?? 0).toLocaleString()} icon={Activity} accentColor="#3b82f6" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h3 className="font-semibold text-[#f0f0f0] mb-4">Transaction Volume</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8f135" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c8f135" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, color: '#f0f0f0' }} />
                <Area type="monotone" dataKey="amount" stroke="#c8f135" fill="url(#gradAmt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-[#555] text-sm">No transaction data yet.</div>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-[#f0f0f0] mb-4">Balance Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, color: '#f0f0f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: '#888', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-[#555] text-sm">No data yet.</div>
          )}
        </div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#f0f0f0]">Recent Transactions</h3>
          <Link to="/transactions" className="text-sm text-[#c8f135] hover:underline font-medium">View all →</Link>
        </div>
        {txns.length === 0 ? (
          <div className="text-center py-10 text-[#555]">
            <Activity size={36} className="mx-auto mb-2 opacity-30" />
            <p>No transactions yet.</p>
            <Link to="/transactions/new" className="text-[#c8f135] hover:underline text-sm font-medium">Create your first →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left py-2 text-[#555] font-medium text-xs uppercase tracking-wide">Reference</th>
                  <th className="text-left py-2 text-[#555] font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Description</th>
                  <th className="text-left py-2 text-[#555] font-medium text-xs uppercase tracking-wide hidden md:table-cell">Debit</th>
                  <th className="text-left py-2 text-[#555] font-medium text-xs uppercase tracking-wide hidden md:table-cell">Credit</th>
                  <th className="text-right py-2 text-[#555] font-medium text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-right py-2 text-[#555] font-medium text-xs uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 font-mono text-xs text-[#888]">{t.referenceNumber}</td>
                    <td className="py-3 text-[#ccc] hidden sm:table-cell max-w-xs truncate">{t.description}</td>
                    <td className="py-3 hidden md:table-cell"><span className="badge-debit">{t.debitAccountName}</span></td>
                    <td className="py-3 hidden md:table-cell"><span className="badge-credit">{t.creditAccountName}</span></td>
                    <td className="py-3 text-right font-semibold text-[#c8f135]">{fmt(t.amount)}</td>
                    <td className="py-3 text-right text-[#555] text-xs">{format(new Date(t.transactionDate || t.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
