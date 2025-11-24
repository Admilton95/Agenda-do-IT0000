import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Mail, Phone } from 'lucide-react';

export const Clients: React.FC = () => {
  const { clients } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-secondary" />
            Clientes
        </h2>
        <div className="text-sm text-slate-500">
            Total: {clients.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                Nenhum cliente cadastrado. Use a IA para adicionar.
            </div>
        ) : (
            clients.map(client => (
                <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{client.name}</h3>
                            <p className="text-xs text-slate-400">ID: {client.id.slice(0,8)}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-slate-400" />
                            {client.email || 'Sem email'}
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={16} className="text-slate-400" />
                            {client.contact || 'Sem contacto'}
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
