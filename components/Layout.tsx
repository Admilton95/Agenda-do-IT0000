import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, Calendar, DollarSign, PieChart, ShieldCheck } from 'lucide-react';
import { QuickChatPanel } from './QuickChatPanel';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
      active 
        ? 'bg-secondary text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-primary flex-shrink-0 flex flex-col text-white shadow-xl z-20 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-gradient-to-br from-secondary to-accent p-2 rounded-lg">
                <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg tracking-tight">Agenda do IT</h1>
                <p className="text-xs text-slate-400">Microempresa Gestão</p>
            </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={path === '/'} />
          <NavItem to="/chat" icon={<MessageSquare size={20} />} label="Central IA (Agentes)" active={path === '/chat'} />
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Gestão</p>
          <NavItem to="/schedule" icon={<Calendar size={20} />} label="Agenda & Serviços" active={path === '/schedule'} />
          <NavItem to="/clients" icon={<Users size={20} />} label="Clientes" active={path === '/clients'} />
          <NavItem to="/finance" icon={<DollarSign size={20} />} label="Financeiro" active={path === '/finance'} />
          <NavItem to="/reports" icon={<PieChart size={20} />} label="Relatórios" active={path === '/reports'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                    IT
                </div>
                <div className="text-sm">
                    <p className="text-white">Técnico Admin</p>
                    <p className="text-green-400 text-xs">Online</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Mobile Nav Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-primary h-16 flex items-center px-4 z-50 text-white">
         <span className="font-bold">Agenda do IT</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0 relative md:mr-0 mr-0 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Quick Chat Side Panel (Replaces old FAB/Modal) */}
      <QuickChatPanel />
    </div>
  );
};