import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, BookOpen, Plus,
  LogOut, ChevronLeft, ChevronRight, Zap, Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/transactions/new', icon: Plus, label: 'New Entry' },
  { to: '/accounts', icon: BookOpen, label: 'Accounts' },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-[#2a2a2a]', collapsed && 'justify-center px-2')}>
        <div className="bg-[#c8f135] p-1.5 rounded-lg flex-shrink-0">
          <Zap size={18} className="text-[#0e0e0e]" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-[#f0f0f0] font-bold text-sm leading-tight">LedgeMains</p>
            <p className="text-[#555] text-xs">Financial Dashboard</p>
          </div>
        )}
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#c8f135] text-[#0e0e0e] font-bold'
                  : 'text-[#888] hover:bg-[#1e1e1e] hover:text-[#f0f0f0]',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[#2a2a2a] p-3">
        {!collapsed && (
          <div className="px-2 py-1 mb-2">
            <p className="text-[#f0f0f0] text-xs font-semibold truncate">{user?.username}</p>
            <p className="text-[#555] text-xs truncate">{user?.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-[#888] hover:bg-[#ff4d4d]/10 hover:text-[#ff4d4d] transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0e0e]">
      <aside
        className={clsx(
          'hidden md:flex flex-col bg-[#111111] border-r border-[#2a2a2a] transition-all duration-300 flex-shrink-0 relative',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-16 -right-3 bg-[#111111] border border-[#2a2a2a] rounded-full p-1 text-[#555] hover:text-[#c8f135] z-10"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-[#111111] border-r border-[#2a2a2a] z-10">
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#111111] border-b border-[#2a2a2a]">
          <button onClick={() => setMobileOpen(true)} className="text-[#888]">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#c8f135]" />
            <span className="font-bold text-sm text-[#f0f0f0]">LedgeMains</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
