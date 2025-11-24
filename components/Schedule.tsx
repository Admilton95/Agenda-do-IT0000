import React from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, Ticket } from '../types';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles = {
    [TicketStatus.PENDING]: 'bg-amber-100 text-amber-800 border-amber-200',
    [TicketStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
    [TicketStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
    [TicketStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>{status}</span>;
};

export const Schedule: React.FC = () => {
  const { tickets, clients, updateTicketStatus } = useApp();

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente Desconhecido';

  const sortedTickets = [...tickets].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-secondary" />
            Agenda de Serviços
        </h2>
        <button 
            onClick={() => alert("Use a Central IA para criar novos tickets!")}
            className="bg-secondary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
            + Novo Serviço
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {sortedTickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
                <p>Nenhum serviço agendado.</p>
                <p className="text-sm mt-2">Vá à Central IA e diga "Agende um serviço para o Cliente X".</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Data</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Cliente</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Serviço</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Est. (Hrs)</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">
                                    {new Date(ticket.scheduledDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{getClientName(ticket.clientId)}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="font-medium">{ticket.title}</div>
                                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{ticket.description}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{ticket.estimatedHours}h</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={ticket.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {ticket.status === TicketStatus.PENDING && (
                                            <button 
                                                onClick={() => updateTicketStatus(ticket.id, TicketStatus.IN_PROGRESS)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                                                title="Iniciar"
                                            >
                                                <Clock size={18} />
                                            </button>
                                        )}
                                        {ticket.status === TicketStatus.IN_PROGRESS && (
                                            <button 
                                                onClick={() => updateTicketStatus(ticket.id, TicketStatus.COMPLETED, ticket.estimatedHours)}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded" 
                                                title="Concluir"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {ticket.status !== TicketStatus.COMPLETED && ticket.status !== TicketStatus.CANCELLED && (
                                            <button 
                                                onClick={() => updateTicketStatus(ticket.id, TicketStatus.CANCELLED)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded" 
                                                title="Cancelar"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
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
