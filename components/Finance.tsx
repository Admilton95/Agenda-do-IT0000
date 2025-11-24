import React from 'react';
import { useApp } from '../context/AppContext';
import { DollarSign, FileText } from 'lucide-react';

export const Finance: React.FC = () => {
  const { invoices, clients } = useApp();

  const getClientNameByTicketId = (ticketId: string) => {
    // Need access to tickets here, but for simplicity let's assume it's linked or mocked
    return "Cliente do Ticket " + ticketId.slice(0,6);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-secondary" />
            Gestão Financeira
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600">Fatura #</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Data Emissão</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Valor (Kz)</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoices.length === 0 ? (
                         <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                Nenhuma fatura gerada ainda. Complete serviços para gerar faturas.
                            </td>
                         </tr>
                    ) : (
                        invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    {inv.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{new Date(inv.issueDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-700">
                                    {inv.amount.toLocaleString()} Kz
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {inv.isPaid ? 'PAGO' : 'PENDENTE'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
