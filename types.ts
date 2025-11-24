export enum AgentRole {
  SUPERVISOR = 'Supervisor (Master)',
  ADMIN = 'Administrativo',
  OPERATIONAL = 'Operacional',
  FINANCIAL = 'Financeiro',
  ANALYST = 'Analista de Performance',
}

export enum TicketStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Progresso',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado',
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: TicketStatus;
  scheduledDate: string; // ISO String
  estimatedHours: number;
  actualHours?: number;
  cost: number; // 5000 Kz * hours
  createdAt: string;
}

export interface Invoice {
  id: string;
  ticketId: string;
  amount: number;
  isPaid: boolean;
  issueDate: string;
  dueDate: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  agent: AgentRole;
  action: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  agent?: AgentRole;
}

export const HOURLY_RATE_KZ = 5000;
