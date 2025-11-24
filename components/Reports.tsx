import React from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Activity } from 'lucide-react';

export const Reports: React.FC = () => {
  const { logs } = useApp();

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="text-secondary" />
            Relatórios e Logs do Sistema
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-slate-400" />
            Atividade dos Agentes (Logs)
        </h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
                <p className="text-slate-400 text-sm">Nenhuma atividade registrada ainda.</p>
            ) : (
                logs.map(log => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                        <div className="w-24 text-slate-400 text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="flex-1">
                            <span className="font-bold text-slate-700 mr-2">[{log.agent}]</span>
                            <span className="text-slate-600">{log.details}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
