import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AgentRole, ChatMessage } from '../types';
import { generateAgentResponse, buildContextPrompt } from '../services/geminiService';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';

const AGENTS = [
  { id: AgentRole.SUPERVISOR, label: 'Supervisor (Master)', color: 'bg-indigo-600' },
  { id: AgentRole.ADMIN, label: 'Administrativo', color: 'bg-emerald-600' },
  { id: AgentRole.OPERATIONAL, label: 'Operacional', color: 'bg-amber-600' },
  { id: AgentRole.FINANCIAL, label: 'Financeiro', color: 'bg-purple-600' },
  { id: AgentRole.ANALYST, label: 'Analista', color: 'bg-cyan-600' },
];

export const AgentChat: React.FC = () => {
  const { clients, tickets, addClient, addTicket, addLog } = useApp();
  const [activeAgent, setActiveAgent] = useState<AgentRole>(AgentRole.SUPERVISOR);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá! Eu sou a IA Supervisora. Como posso ajudar na gestão da sua empresa hoje?',
      timestamp: Date.now(),
      agent: AgentRole.SUPERVISOR
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages]);

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
      const apiKey = process.env.API_KEY || ''; // Must be injected via build env
      if (!apiKey) {
        throw new Error("API Key not configured");
      }

      const context = buildContextPrompt(clients, tickets);
      
      const response = await generateAgentResponse(apiKey, activeAgent, userMsg.content, context);
      
      const candidate = response.candidates?.[0];
      
      // Handle Tool Calls (Function Calling)
      const toolCalls = candidate?.content?.parts?.filter(p => p.functionCall);
      let finalText = "";
      
      if (toolCalls && toolCalls.length > 0) {
        for (const part of toolCalls) {
            const fc = part.functionCall;
            if(!fc) continue;

            const args = fc.args as any;
            
            if (fc.name === 'addClient') {
                const id = addClient(args);
                finalText += `✅ Cliente ${args.name} adicionado com sucesso (ID: ${id}).\n`;
                addLog(activeAgent, 'CREATE_CLIENT', `Cliente ${args.name} criado via chat`);
            } else if (fc.name === 'createTicket') {
                const id = addTicket(args);
                finalText += `✅ Ticket "${args.title}" agendado para ${args.scheduledDate} (ID: ${id}).\n`;
                addLog(activeAgent, 'CREATE_TICKET', `Ticket ${args.title} criado via chat`);
            }
        }
      }

      // Add text response if present
      const textPart = candidate?.content?.parts?.find(p => p.text);
      if (textPart && textPart.text) {
          finalText += "\n" + textPart.text;
      }

      if (!finalText) finalText = "Tarefa executada com sucesso.";

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: finalText,
        timestamp: Date.now(),
        agent: activeAgent
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação ou a chave de API não está configurada.',
        timestamp: Date.now(),
        agent: activeAgent
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header / Agent Selector */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selecione o Agente</p>
        <div className="flex flex-wrap gap-2">
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                activeAgent === agent.id 
                  ? `${agent.color} text-white shadow-md scale-105` 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {activeAgent === agent.id && <Sparkles size={12} />}
              {agent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-700 text-white' : (AGENTS.find(a => a.id === msg.agent)?.color || 'bg-blue-600') + ' text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {msg.agent && msg.role === 'model' && (
                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase">{msg.agent}</p>
                )}
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start w-full">
                <div className="flex gap-3 max-w-[70%]">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                        <span className="text-xs text-slate-400">A processar...</span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Fale com ${AGENTS.find(a => a.id === activeAgent)?.label}...`}
                className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send size={20} />
            </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
            A IA pode cometer erros. Verifique as informações importantes.
        </p>
      </div>
    </div>
  );
};
