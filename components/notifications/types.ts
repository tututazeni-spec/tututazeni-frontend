// components/notifications/types.ts
// Tipos da caixa de entrada — usados por hooks/useNotificationsInbox.ts e
// components/notifications/InboxView.tsx. Ver memory
// project_innova_component_separation_audit, item 3.6.

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Category =
  | 'LMS'
  | 'PDI'
  | 'PERFORMANCE'
  | 'HR'
  | 'ENGAGEMENT'
  | 'GAMIFICATION'
  | 'SYSTEM'
  | 'ONBOARDING'
  | 'KNOWLEDGE';

export interface Notification {
  id: number;
  type: string;
  title: string | null;
  message: string;
  priority: Priority;
  category: Category | null;
  actionUrl: string | null;
  actionLabel: string | null;
  read: boolean;
  readAt: string | null;
  archived: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface NotifData {
  data: Notification[];
  grouped: {
    today: Notification[];
    yesterday: Notification[];
    thisWeek: Notification[];
    older: Notification[];
  };
  total: number;
  unreadCount: number;
  totalPages: number;
}
