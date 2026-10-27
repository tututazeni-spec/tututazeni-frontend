export type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type Category =
  'ACCESS' | 'BUG' | 'QUESTION' | 'REQUEST' | 'BILLING' | 'OTHER';
export type TicketStatus =
  'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export const PRIORITY_LABEL: Record<Priority, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa',
};

export const PRIORITY_HINT: Record<Priority, string> = {
  CRITICAL: 'Não consigo trabalhar',
  HIGH: 'Falha importante, há alternativa penosa',
  NORMAL: 'Dúvida ou problema que não bloqueia',
  LOW: 'Sugestão ou pedido sem urgência',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ACCESS: 'Acesso e conta',
  BUG: 'Algo não funciona',
  QUESTION: 'Dúvida de utilização',
  REQUEST: 'Pedido ou sugestão',
  BILLING: 'Faturação',
  OTHER: 'Outro assunto',
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em tratamento',
  WAITING_CUSTOMER: 'A aguardar a sua resposta',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

export interface Channels {
  email: string | null;
  hours: string;
  responseTargets: Array<{ priority: Priority; businessHours: number }>;
  statusPageUrl: string | null;
}

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  firstResponseDueAt: string;
  firstRespondedAt: string | null;
  createdAt: string;
  overdue?: boolean;
  requester?: { id: number; fullName: string; email: string };
}

export interface TicketMessage {
  id: number;
  body: string;
  staff: boolean;
  internal: boolean;
  createdAt: string;
  author: { id: number; fullName: string } | null;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
