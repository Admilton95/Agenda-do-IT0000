import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, HOURLY_RATE_KZ } from '../types';
import { CalendarCheck, DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; subtext?: string }> = ({ title, value, icon, color, subtext }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { tickets, invoices } = useApp();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const todaysTickets = tickets.filter(t => t.scheduledDate.startsWith(today));
    const pendingTickets = tickets.filter(t => t.status === TicketStatus.PENDING || t.status === TicketStatus.IN_PROGRESS);
    
    // Calculate projected daily income based on scheduled hours
    const dailyProjectedIncome = todaysTickets.reduce((acc, t) => acc + (t.estimatedHours * HOURLY_RATE_KZ), 0);
    
    const totalPendingIncome = invoices.filter(i => !i.isPaid).reduce((acc, i) => acc + i.amount, 0);

    return {
      todayCount: todaysTickets.length,
      pendingCount: pendingTickets.length,
      dailyIncome: dailyProjectedIncome,
      receivables: totalPendingIncome
    };
  }, [tickets, invoices]);

  const chartData = useMemo(() => {
    // Simple mock projection for the chart based on existing tickets per day
    const data: Record<string, number> = {};
    tickets.forEach(t => {
        const date = t.scheduledDate.split('T')[0];
        data[date] = (data[date] || 0) + t.cost;
    });
    return Object.entries(data).slice(-7).map(([date, amount]) => ({ date, amount }));
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel de Controlo</h2>
            <p className="text-slate-500">Visão geral da operação hoje</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-100 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            IA Supervisora Ativa
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Serviços Hoje" 
          value={stats.todayCount.toString()} 
          icon={<CalendarCheck size={24} />} 
          color="bg-blue-500" 
          subtext="Agendados para hoje"
        />
        <StatCard 
          title="Faturação Prevista (Dia)" 
          value={`${stats.dailyIncome.toLocaleString()} Kz`} 
          icon={<TrendingUp size={24} />} 
          color="bg-green-500"
          subtext={`Baseado em ${stats.todayCount} serviços`}
        />
        <StatCard 
          title="Pendentes Operacionais" 
          value={stats.pendingCount.toString()} 
          icon={<Clock size={24} />} 
          color="bg-amber-500"
          subtext="Tickets aguardando ação"
        />
        <StatCard 
          title="A Receber" 
          value={`${stats.receivables.toLocaleString()} Kz`} 
          icon={<DollarSign size={24} />} 
          color="bg-purple-500"
          subtext="Faturas em aberto"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4">Fluxo de Receita (Últimos 7 dias)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                        <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value) => [`${value} Kz`, 'Receita']}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                {chartData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                        Sem dados suficientes para o gráfico
                    </div>
                )}
            </div>
        </div>

        {/* Quick Actions / Notifications */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-orange-500" />
                Avisos da IA
            </h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
                {stats.pendingCount > 2 && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <p className="text-xs font-bold text-orange-800 uppercase mb-1">Operacional</p>
                        <p className="text-sm text-orange-700">Você tem muitos tickets acumulados. Considere reagendar tarefas não urgentes.</p>
                    </div>
                )}
                {stats.receivables > 20000 && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                         <p className="text-xs font-bold text-purple-800 uppercase mb-1">Financeiro</p>
                        <p className="text-sm text-purple-700">Valor alto a receber ({stats.receivables.toLocaleString()} Kz). A IA sugere enviar lembretes de cobrança.</p>
                    </div>
                )}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                     <p className="text-xs font-bold text-blue-800 uppercase mb-1">Supervisor</p>
                    <p className="text-sm text-blue-700">Bom dia! O custo hora está configurado para {HOURLY_RATE_KZ} Kz. Mantenha os registros atualizados.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
