import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, Activity,
  ArrowUpRight, ArrowDownRight, Plus, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardApi, transactionsApi, DashboardSummary, Transaction } from '../api/ledgerApi';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard: React.FC<{
  title: string; value: string; icon: React.ElementType;
  change?: number; color: string; bg: string;
}> = ({ title, value, icon: Icon, change, color, bg }) => (
  <div className="card flex items-start justify-between">
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {change !== undefined && (
        <p className={clsChange(change)}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change).toFixed(1)}% vs last month
        </p>
      )}
    </div>
    <div className={`${bg} p-3 rounded-xl`}>
      <Icon size={22} className={color} />
    </div>
  </div>
);

const clsChange = (n: number) =>
  `flex items-center gap-0.5 text-xs font-medium mt-1 ${n >= 0 ? 'text-green-600' : 'text-red-500'}`;

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [s, t] = await Promise.all([
        dashboardApi.summary(),
        transactionsApi.list({ pageSize: 8 }),
      ]);
      setSummary(s);
      setTxns(t);
    } catch {
      setError('Could not load dashboard. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Build mock chart data from transactions if available
  const chartData = txns.slice(0, 7).reverse().map((t, i) => ({
    date: format(new Date(t.transactionDate || t.createdAt), 'MMM d'),
    amount: t.amount,
  }));

  const pieData = summary ? [
    { name: 'Assets',      value: summary.totalAssets },
    { name: 'Revenue',     value: summary.totalRevenue },
    { name: 'Equity',      value: summary.totalEquity },
    { name: 'Liabilities', value: summary.totalLiabilities },
    { name: 'Expenses',    value: summary.totalExpenses },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.username} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's your financial overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/transactions/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> New Transaction
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Assets"      value={fmt(summary?.totalAssets ?? 0)}      icon={Wallet}     color="text-blue-600"  bg="bg-blue-50" />
        <StatCard title="Total Revenue"     value={fmt(summary?.totalRevenue ?? 0)}     icon={TrendingUp}  color="text-green-600" bg="bg-green-50" />
        <StatCard title="Total Expenses"    value={fmt(summary?.totalExpenses ?? 0)}    icon={TrendingDown} color="text-red-500"   bg="bg-red-50" />
        <StatCard title="Total Transactions" value={(summary?.transactionCount ?? 0).toLocaleString()} icon={Activity} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="card xl:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Transaction Volume</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="url(#gradAmt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              No transaction data to display yet.
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Account Balance Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data yet.</div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
          <Link to="/transactions" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
        </div>
        {txns.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Activity size={36} className="mx-auto mb-2 opacity-30" />
            <p>No transactions yet.</p>
            <Link to="/transactions/new" className="text-blue-600 hover:underline text-sm font-medium">Create your first transaction →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-slate-500 font-medium">Reference</th>
                  <th className="text-left py-2 text-slate-500 font-medium hidden sm:table-cell">Description</th>
                  <th className="text-left py-2 text-slate-500 font-medium hidden md:table-cell">Debit</th>
                  <th className="text-left py-2 text-slate-500 font-medium hidden md:table-cell">Credit</th>
                  <th className="text-right py-2 text-slate-500 font-medium">Amount</th>
                  <th className="text-right py-2 text-slate-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono text-xs text-slate-600">{t.referenceNumber}</td>
                    <td className="py-3 text-slate-700 hidden sm:table-cell max-w-xs truncate">{t.description}</td>
                    <td className="py-3 hidden md:table-cell"><span className="badge-debit">{t.debitAccountName}</span></td>
                    <td className="py-3 hidden md:table-cell"><span className="badge-credit">{t.creditAccountName}</span></td>
                    <td className="py-3 text-right font-semibold text-slate-800">{fmt(t.amount)}</td>
                    <td className="py-3 text-right text-slate-500 text-xs">
                      {format(new Date(t.transactionDate || t.createdAt), 'MMM d, yyyy')}
                    </td>
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
