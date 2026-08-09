// components/notifications/InboxView.tsx
// Vista apresentacional da caixa de entrada — sem fetch, sem mutações
// (tudo isso vem do container, hooks/useNotificationsInbox.ts, usado em
// InboxView dentro de app/(platform)/notifications/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

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
  LOW: { icon: '○', cls: 'text-gray-400', border: 'border-gray-100' },
  MEDIUM: { icon: '●', cls: 'text-blue-500', border: 'border-blue-100' },
  HIGH: { icon: '▲', cls: 'text-amber-500', border: 'border-amber-100' },
  CRITICAL: { icon: '🔴', cls: 'text-red-600', border: 'border-red-200' },
};

function NotifItem({
  notif,
  onRead,
  onArchive,
}: {
  notif: Notification;
  onRead: (id: number) => void;
  onArchive: (id: number) => void;
}) {
  const priorityCfg = PRIORITY_CFG[notif.priority] ?? PRIORITY_CFG.MEDIUM;
  const catCfg = notif.category ? CATEGORY_CFG[notif.category] : null;

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
        !notif.read ? 'bg-blue-50/40' : ''
      } ${notif.priority === 'CRITICAL' ? 'border-l-4 border-l-red-400' : ''}`}
    >
      {/* Priority indicator */}
      <div className={`mt-1 text-sm flex-shrink-0 ${priorityCfg.cls}`}>
        {priorityCfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {notif.title && (
              <div
                className={`text-sm font-semibold mb-0.5 ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}
              >
                {notif.title}
              </div>
            )}
            <p
              className={`text-sm leading-relaxed ${!notif.read ? 'text-gray-800' : 'text-gray-500'}`}
            >
              {notif.message}
            </p>
          </div>

          {!notif.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {catCfg && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${catCfg.cls}`}>
              {catCfg.icon} {catCfg.label}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timeAgo(notif.createdAt)}
          </span>

          {notif.actionUrl && (
            <a
              href={notif.actionUrl}
              className="text-xs text-blue-600 hover:underline font-medium"
              onClick={() => !notif.read && onRead(notif.id)}
            >
              {notif.actionLabel ?? 'Ver →'}
            </a>
          )}

          {/* Acções hover */}
          <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.read && (
              <button
                onClick={() => onRead(notif.id)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Marcar lida
              </button>
            )}
            <button
              onClick={() => onArchive(notif.id)}
              className="text-xs text-gray-400 hover:text-gray-600"
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
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
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
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>

        {/* Read filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onReadFilterChange(f)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                readFilter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ all: 'Todas', unread: 'Não lidas', read: 'Lidas' }[f]}
            </button>
          ))}
        </div>

        {data && data.unreadCount > 0 && (
          <button
            onClick={onReadAll}
            disabled={marking}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.data.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🔔</div>
              <div className="text-sm text-gray-400">
                Nenhuma notificação encontrada
              </div>
            </div>
          ) : (
            <>
              {renderGroup('Hoje', data.grouped.today)}
              {renderGroup('Ontem', data.grouped.yesterday)}
              {renderGroup('Esta semana', data.grouped.thisWeek)}
              {renderGroup('Antigas', data.grouped.older)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
