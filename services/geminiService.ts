import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AgentRole, Ticket, Client, HOURLY_RATE_KZ } from "../types";

// Helper to get formatted context for the AI
export const buildContextPrompt = (clients: Client[], tickets: Ticket[]) => {
  const pendingTickets = tickets.filter(t => t.status !== 'Concluído' && t.status !== 'Cancelado');
  
  return `
    CONTEXTO ATUAL DA EMPRESA:
    - Preço por hora: ${HOURLY_RATE_KZ} Kz.
    - Clientes Cadastrados: ${clients.map(c => `${c.name} (ID: ${c.id})`).join(', ')}.
    - Tickets Pendentes/Agendados: ${pendingTickets.map(t => `[${t.scheduledDate}] ${t.title} para Cliente ${t.clientId} (${t.status})`).join('; ')}.
    
    Você é um assistente integrado a um sistema. Use as ferramentas fornecidas (tools) para executar ações reais como criar tickets ou clientes quando solicitado.
  `;
};

const getSystemInstruction = (role: AgentRole): string => {
  const base = "Você é uma IA especializada trabalhando para uma microempresa de TI de um único técnico.";
  
  switch (role) {
    case AgentRole.ADMIN:
      return `${base} Seu foco é agenda, cadastro de clientes e organização. Seja cortês e eficiente.`;
    case AgentRole.OPERATIONAL:
      return `${base} Você é o registro oficial de serviços. Quando o técnico disser o que fez, extraia: Cliente, Resumo, Detalhes e Horas. Se faltar horas, assuma 1h ou pergunte. Use IMEDIATAMENTE a ferramenta 'logWorkDone' para registrar serviços completados. Não enrole.`;
    case AgentRole.FINANCIAL:
      return `${base} Seu foco é fluxo de caixa, custos e faturas. Seja analítico e conservador. Lembre-se sempre que a hora custa ${HOURLY_RATE_KZ} Kz.`;
    case AgentRole.ANALYST:
      return `${base} Seu foco é métricas e melhoria de processos. Busque padrões e sugira otimizações.`;
    case AgentRole.SUPERVISOR:
    default:
      return `${base} Você é o Gerente Geral (Master). Você coordena os outros agentes. Se o usuário pedir algo genérico, decida qual a melhor ação. Mantenha a visão holística do negócio.`;
  }
};

// Function Definitions for Gemini Tools
const addClientTool: FunctionDeclaration = {
  name: 'addClient',
  description: 'Adiciona um novo cliente à base de dados.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome do cliente' },
      contact: { type: Type.STRING, description: 'Telefone do cliente' },
      email: { type: Type.STRING, description: 'Email do cliente' },
    },
    required: ['name'],
  },
};

const createTicketTool: FunctionDeclaration = {
  name: 'createTicket',
  description: 'Cria um novo ticket de serviço ou agendamento para o futuro.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientId: { type: Type.STRING, description: 'ID do cliente (se não souber, peça ao usuário)' },
      title: { type: Type.STRING, description: 'Título resumido do serviço' },
      description: { type: Type.STRING, description: 'Descrição detalhada do problema' },
      scheduledDate: { type: Type.STRING, description: 'Data agendada ISO 8601 (YYYY-MM-DD)' },
      estimatedHours: { type: Type.NUMBER, description: 'Estimativa de horas de trabalho' },
    },
    required: ['title', 'scheduledDate'],
  },
};

const logWorkDoneTool: FunctionDeclaration = {
  name: 'logWorkDone',
  description: 'Registra um trabalho já realizado pelo técnico (Relatório Operacional). Cria ticket concluído, calcula custo e gera fatura automaticamente.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientName: { type: Type.STRING, description: 'Nome do cliente identificado no texto' },
      summary: { type: Type.STRING, description: 'Resumo curto do que foi feito (ex: Formatação PC)' },
      details: { type: Type.STRING, description: 'Detalhes técnicos completos da resolução' },
      hours: { type: Type.NUMBER, description: 'Horas gastas' },
    },
    required: ['summary', 'hours', 'clientName'],
  },
};

export const tools: Tool[] = [{
  functionDeclarations: [addClientTool, createTicketTool, logWorkDoneTool],
}];

export const generateAgentResponse = async (
  apiKey: string,
  role: AgentRole,
  userMessage: string,
  appContext: string
) => {
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `${getSystemInstruction(role)}\n${appContext}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
        temperature: 0.7,
      }
    });
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};