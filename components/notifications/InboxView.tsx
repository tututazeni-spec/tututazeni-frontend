// components/notifications/InboxView.tsx
// Vista apresentacional da caixa de entrada — sem fetch, sem mutações
// (tudo isso vem do container, hooks/useNotificationsInbox.ts, usado em
// InboxView dentro de app/(platform)/notifications/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORY_CFG, Skeleton } from './shared';
import type { NotifData, Notification, Priority } from './types';
import type { ReadFilter } from '@/hooks/useNotificationsInbox';

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora mesmo';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  return `há ${days} dias`;
}

const PRIORITY_CFG: Record<
  Priority,
  { icon: string; cls: string; border: string }
> = {
  LOW: { icon: '○', cls: 'text-ink-faint', border: 'border-border' },
  MEDIUM: { icon: '●', cls: 'text-info', border: 'border-info-subtle' },
  HIGH: { icon: '▲', cls: 'text-warning', border: 'border-warning-subtle' },
  CRITICAL: { icon: '🔴', cls: 'text-danger', border: 'border-danger' },
};

const READ_FILTERS: Array<{ id: ReadFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'read', label: 'Lidas' },
];

interface NotifItemProps {
  notif: Notification;
  onRead: (id: number) => void;
  onArchive: (id: number) => void;
}

function NotifItem({ notif, onRead, onArchive }: NotifItemProps) {
  const priorityCfg = PRIORITY_CFG[notif.priority] ?? PRIORITY_CFG.MEDIUM;
  const catCfg = notif.category ? CATEGORY_CFG[notif.category] : null;

  return (
    <div
      className={`group flex items-start gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-sunken ${
        !notif.read ? 'bg-primary-subtle/40' : ''
      } ${notif.priority === 'CRITICAL' ? 'border-l-4 border-l-danger' : ''}`}
    >
      {/* Priority indicator */}
      <div className={`mt-1 flex-shrink-0 text-sm ${priorityCfg.cls}`}>
        {priorityCfg.icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {notif.title && (
              <div
                className={`mb-0.5 font-body text-sm font-semibold ${!notif.read ? 'text-ink' : 'text-ink-muted'}`}
              >
                {notif.title}
              </div>
            )}
            <p
              className={`font-body text-sm leading-relaxed ${!notif.read ? 'text-ink' : 'text-ink-faint'}`}
            >
              {notif.message}
            </p>
          </div>

          {!notif.read && (
            <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {catCfg && (
            <span
              className={`rounded-pill px-1.5 py-0.5 font-body text-xs ${catCfg.cls}`}
            >
              {catCfg.label}
            </span>
          )}
          <span className="font-body text-xs text-ink-faint">
            {timeAgo(notif.createdAt)}
          </span>

          {notif.actionUrl && (
            <a
              href={notif.actionUrl}
              className="font-body text-xs font-medium text-primary hover:underline"
              onClick={() => !notif.read && onRead(notif.id)}
            >
              {notif.actionLabel ?? 'Ver →'}
            </a>
          )}

          {/* Acções hover */}
          <div className="ml-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {!notif.read && (
              <button
                onClick={() => onRead(notif.id)}
                className="font-body text-xs text-primary hover:text-primary-hover"
              >
                Marcar lida
              </button>
            )}
            <button
              onClick={() => onArchive(notif.id)}
              className="font-body text-xs text-ink-faint hover:text-ink-muted"
            >
              Arquivar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface InboxViewProps {
  category: string;
  onCategoryChange: (category: string) => void;
  readFilter: ReadFilter;
  onReadFilterChange: (filter: ReadFilter) => void;
  data: NotifData | undefined;
  loading: boolean;
  onRead: (id: number) => void;
  onArchive: (id: number) => void;
  onReadAll: () => void;
  marking: boolean;
}

export function InboxView({
  category,
  onCategoryChange,
  readFilter,
  onReadFilterChange,
  data,
  loading,
  onRead,
  onArchive,
  onReadAll,
  marking,
}: InboxViewProps) {
  const renderGroup = (label: string, items: Notification[]) => {
    if (!items.length) return null;
    return (
      <div key={label}>
        <div className="border-b border-border bg-surface-sunken px-4 py-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {label}
        </div>
        {items.map((n) => (
          <NotifItem
            key={n.id}
            notif={n}
            onRead={onRead}
            onArchive={onArchive}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Read filter */}
        <div className="flex gap-1 rounded-control bg-surface-sunken p-1">
          {READ_FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              intent={readFilter === f.id ? 'primary' : 'ghost'}
              onClick={() => onReadFilterChange(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {data && data.unreadCount > 0 && (
          <button
            onClick={onReadAll}
            disabled={marking}
            className="ml-auto font-body text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50"
          >
            {marking
              ? 'A marcar…'
              : `Marcar todas como lidas (${data.unreadCount})`}
          </button>
        )}
      </div>

      {loading ? (
        <Skeleton />
      ) : !data ? null : (
        <Card className="overflow-hidden">
          {data.data.length === 0 ? (
            <EmptyState
              title="Nenhuma notificação encontrada"
              description="Não há notificações para os filtros seleccionados."
            />
          ) : (
            <>
              {renderGroup('Hoje', data.grouped.today)}
              {renderGroup('Ontem', data.grouped.yesterday)}
              {renderGroup('Esta semana', data.grouped.thisWeek)}
              {renderGroup('Antigas', data.grouped.older)}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
