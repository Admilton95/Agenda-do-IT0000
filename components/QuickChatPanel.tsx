import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AgentRole, ChatMessage } from '../types';
import { generateAgentResponse, buildContextPrompt } from '../services/geminiService';
import { Send, Loader2, ChevronDown, ChevronUp, MessageCircle, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';

export const QuickChatPanel: React.FC = () => {
  const { clients, tickets, addClient, addTicket, logCompletedWork, addLog } = useApp();
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: 'intro',
        role: 'model',
        content: 'Agente Operacional online. Digite os detalhes do serviço (Cliente, o que foi feito, horas gastas) para eu gerar o relatório e fatura.',
        timestamp: Date.now(),
        agent: AgentRole.OPERATIONAL
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY || '';
      const context = buildContextPrompt(clients, tickets);
      
      // Always force OPERATIONAL role for this quick panel
      const response = await generateAgentResponse(apiKey, AgentRole.OPERATIONAL, userMsg.content, context);
      
      const candidate = response.candidates?.[0];
      
      const toolCalls = candidate?.content?.parts?.filter(p => p.functionCall);
      let systemActionMsg = "";
      
      if (toolCalls && toolCalls.length > 0) {
        for (const part of toolCalls) {
            const fc = part.functionCall;
            if(!fc) continue;
            const args = fc.args as any;
            
            if (fc.name === 'logWorkDone') {
                const { cost } = logCompletedWork(args.clientName, args.summary, args.details || args.summary, args.hours);
                systemActionMsg += `✅ Relatório Criado: "${args.summary}"\n💰 Fatura Gerada: ${cost.toLocaleString()} Kz\n⏱ Tempo: ${args.hours}h`;
                addLog(AgentRole.OPERATIONAL, 'REPORT_WORK', `Relatório chat: ${args.summary}`);
            } else if (fc.name === 'addClient') {
                addClient(args);
                systemActionMsg += `✅ Cliente ${args.name} cadastrado.`;
            } else if (fc.name === 'createTicket') {
                addTicket(args);
                systemActionMsg += `✅ Agendamento criado para ${args.scheduledDate}.`;
            }
        }
      }

      // Add text response if present
      let textResponse = candidate?.content?.parts?.find(p => p.text)?.text || "";

      // If we performed an action but the model didn't give a text response, use our system message
      if (systemActionMsg && !textResponse) {
          textResponse = "Processado com sucesso.";
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: systemActionMsg ? `${textResponse}\n\n${systemActionMsg}` : textResponse,
        timestamp: Date.now(),
        agent: AgentRole.OPERATIONAL
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        content: 'Erro na comunicação. Verifique a chave de API.',
        timestamp: Date.now(),
        agent: AgentRole.OPERATIONAL
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
        className={`fixed right-0 bottom-0 bg-white shadow-2xl transition-all duration-300 z-40 flex flex-col border-l border-t border-slate-200
        ${isOpen ? 'w-full md:w-96 h-[600px] md:h-[calc(100vh-64px)] rounded-tl-xl' : 'w-72 h-14 rounded-tl-xl overflow-hidden'}`}
    >
        {/* Header */}
        <div 
            className="bg-slate-900 text-white p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-green-400 animate-pulse' : 'bg-green-500'}`}></div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <MessageCircle size={16} />
                    Chat Operacional
                </h3>
            </div>
            {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>

        {/* Chat Body */}
        {isOpen && (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm whitespace-pre-wrap ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                            }`}>
                                {msg.role === 'model' && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
                                        <Bot size={12} />
                                        Agente Operacional
                                    </div>
                                )}
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-blue-500" />
                                <span className="text-xs text-slate-400">Processando relatório...</span>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-200">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ex: Instalei SSD no servidor do Cliente A, levou 3 horas."
                            className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-12 max-h-32 min-h-[48px]"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        Diga o que fez e o tempo gasto para gerar fatura.
                    </p>
                </div>
            </>
        )}
    </div>
  );
};