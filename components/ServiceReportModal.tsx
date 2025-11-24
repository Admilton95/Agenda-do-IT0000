import React, { useState } from 'react';
import { X, Send, Loader2, Sparkles, CheckCircle, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AgentRole, HOURLY_RATE_KZ } from '../types';
import { buildContextPrompt, generateAgentResponse } from '../services/geminiService';

interface ServiceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceReportModal: React.FC<ServiceReportModalProps> = ({ isOpen, onClose }) => {
  const { clients, tickets, logCompletedWork, addLog } = useApp();
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ cost: number; summary: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description || !hours) return;
    setIsLoading(true);
    setResult(null);

    try {
      const apiKey = process.env.API_KEY || '';
      const context = buildContextPrompt(clients, tickets);
      
      // We instruct the AI specifically to use the logWorkDone tool
      const prompt = `
        O TÉCNICO ESTÁ REPORTANDO UM SERVIÇO CONCLUÍDO.
        Descrição do técnico: "${description}"
        Tempo gasto: ${hours} horas.
        
        Sua tarefa:
        1. Identifique o nome do cliente no texto (ou use "Cliente Avulso" se não encontrar).
        2. Resuma o serviço.
        3. Chame a função 'logWorkDone' com os dados corretos.
      `;

      const response = await generateAgentResponse(apiKey, AgentRole.OPERATIONAL, prompt, context);
      const candidate = response.candidates?.[0];
      
      const toolCall = candidate?.content?.parts?.find(p => p.functionCall)?.functionCall;

      if (toolCall && toolCall.name === 'logWorkDone') {
        const args = toolCall.args as any;
        
        // Execute the context function
        const { cost } = logCompletedWork(args.clientName, args.summary, args.details || description, args.hours);
        
        addLog(AgentRole.OPERATIONAL, 'REPORT_WORK', `Relatório gerado: ${args.summary} (${args.hours}h)`);
        
        setResult({
            cost,
            summary: `Relatório de "${args.summary}" para ${args.clientName} processado com sucesso.`
        });
        setDescription('');
        setHours('');
      } else {
        // Fallback if AI didn't call the tool
        setResult({
            cost: 0,
            summary: "A IA não conseguiu processar automaticamente. Tente ser mais específico."
        });
      }

    } catch (error) {
      console.error(error);
      setResult({ cost: 0, summary: "Erro de conexão com a Agência." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-primary p-6 flex justify-between items-center text-white">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="text-accent" />
                    Reportar Atividade
                </h3>
                <p className="text-slate-400 text-xs mt-1">Chat direto com IA Operacional & Financeira</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
            {!result ? (
                <>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                        <p>Descreva o que foi feito. A IA irá identificar o cliente, criar o relatório, calcular o valor e emitir a fatura automaticamente.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">O que foi feito? (Inclua nome do cliente)</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Formatei o computador da Ana e instalei o Office..."
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-secondary focus:outline-none h-32 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tempo Gasto (Horas)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="Ex: 2"
                                className="w-full border border-slate-300 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                            />
                            <div className="absolute left-3 top-3 text-slate-400">
                                <Calculator size={18} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-right">Custo base: {HOURLY_RATE_KZ.toLocaleString()} Kz/hora</p>
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading || !description || !hours}
                        className="w-full bg-secondary hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        {isLoading ? 'Processando Relatório...' : 'Enviar para Agência'}
                    </button>
                </>
            ) : (
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">Relatório Gerado!</h4>
                    <p className="text-slate-600 mb-6">{result.summary}</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl mb-6 inline-block w-full">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1">Orçamento Gerado</p>
                        <p className="text-3xl font-bold text-secondary">{result.cost.toLocaleString()} Kz</p>
                    </div>

                    <button 
                        onClick={() => { setResult(null); onClose(); }}
                        className="w-full bg-slate-800 text-white font-medium py-3 rounded-xl hover:bg-slate-900 transition-colors"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={() => setResult(null)}
                        className="w-full mt-2 text-slate-500 text-sm hover:text-slate-800 py-2"
                    >
                        Reportar Outro
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};