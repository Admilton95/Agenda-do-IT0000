import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Ticket, Invoice, SystemLog, TicketStatus, HOURLY_RATE_KZ, AgentRole } from '../types';

interface AppContextType {
  clients: Client[];
  tickets: Ticket[];
  invoices: Invoice[];
  logs: SystemLog[];
  addClient: (client: Omit<Client, 'id'>) => string;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'cost' | 'status'>) => string;
  updateTicketStatus: (id: string, status: TicketStatus, actualHours?: number) => void;
  logCompletedWork: (clientName: string, summary: string, details: string, hours: number) => { ticketId: string, invoiceId: string, cost: number };
  addLog: (role: AgentRole, action: string, details: string) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Load initial data
  useEffect(() => {
    const load = (key: string) => {
      const data = localStorage.getItem(`agenda_it_${key}`);
      return data ? JSON.parse(data) : [];
    };
    setClients(load('clients'));
    setTickets(load('tickets'));
    setInvoices(load('invoices'));
    setLogs(load('logs'));
  }, []);

  // Save data on changes
  useEffect(() => localStorage.setItem('agenda_it_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('agenda_it_tickets', JSON.stringify(tickets)), [tickets]);
  useEffect(() => localStorage.setItem('agenda_it_invoices', JSON.stringify(invoices)), [invoices]);
  useEffect(() => localStorage.setItem('agenda_it_logs', JSON.stringify(logs)), [logs]);

  const addClient = (data: Omit<Client, 'id'>) => {
    const newClient: Client = { ...data, id: crypto.randomUUID() };
    setClients(prev => [...prev, newClient]);
    return newClient.id;
  };

  const addTicket = (data: Omit<Ticket, 'id' | 'createdAt' | 'cost' | 'status'>) => {
    const newTicket: Ticket = {
      ...data,
      id: crypto.randomUUID(),
      status: TicketStatus.PENDING,
      cost: data.estimatedHours * HOURLY_RATE_KZ,
      createdAt: new Date().toISOString(),
    };
    setTickets(prev => [...prev, newTicket]);
    return newTicket.id;
  };

  const updateTicketStatus = (id: string, status: TicketStatus, actualHours?: number) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const updated = { ...t, status };
      if (actualHours !== undefined) {
        updated.actualHours = actualHours;
        updated.cost = actualHours * HOURLY_RATE_KZ;
      }
      
      // Auto-generate invoice if completed
      if (status === TicketStatus.COMPLETED && t.status !== TicketStatus.COMPLETED) {
        const inv: Invoice = {
          id: crypto.randomUUID(),
          ticketId: t.id,
          amount: updated.cost,
          isPaid: false,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 days
        };
        setInvoices(curr => [...curr, inv]);
      }
      return updated;
    }));
  };

  // Special function for the "Report Work" button
  const logCompletedWork = (clientName: string, summary: string, details: string, hours: number) => {
    let clientId = clients.find(c => c.name.toLowerCase().includes(clientName.toLowerCase()))?.id;
    
    // Auto-create client if loose match fails
    if (!clientId) {
        clientId = addClient({ name: clientName, contact: 'N/A', email: 'N/A' });
    }

    const cost = hours * HOURLY_RATE_KZ;
    const ticketId = crypto.randomUUID();
    
    const newTicket: Ticket = {
        id: ticketId,
        clientId,
        title: summary,
        description: details,
        status: TicketStatus.COMPLETED,
        scheduledDate: new Date().toISOString(), // Done today
        estimatedHours: hours,
        actualHours: hours,
        cost: cost,
        createdAt: new Date().toISOString()
    };

    setTickets(prev => [...prev, newTicket]);

    // Generate Invoice immediately
    const invoiceId = crypto.randomUUID();
    const newInvoice: Invoice = {
        id: invoiceId,
        ticketId: ticketId,
        amount: cost,
        isPaid: false,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    setInvoices(prev => [...prev, newInvoice]);

    return { ticketId, invoiceId, cost };
  };

  const addLog = (agent: AgentRole, action: string, details: string) => {
    const newLog: SystemLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const refreshData = () => {
     // Trigger re-render if needed, currently state updates handle this
  };

  return (
    <AppContext.Provider value={{ clients, tickets, invoices, logs, addClient, addTicket, updateTicketStatus, logCompletedWork, addLog, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};