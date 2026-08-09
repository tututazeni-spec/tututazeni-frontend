// components/notifications/AdminView.tsx
// Vista apresentacional da administração de notificações — sem fetch, sem
// mutações (tudo isso vem do container, hooks/useNotificationsAdmin.ts, usado
// em AdminView dentro de app/(platform)/notifications/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import type { Dispatch, SetStateAction } from 'react';
import { CATEGORY_CFG, Skeleton } from './shared';
import type { AdminForm, Stats } from './types';

export interface AdminViewProps {
  stats: Stats | undefined;
  loading: boolean;
  form: AdminForm;
  setForm: Dispatch<SetStateAction<AdminForm>>;
  sending: boolean;
  handleSendAll: () => void;
}

export function AdminView({
  stats,
  loading,
  form,
  setForm,
  sending,
  handleSendAll,
}: AdminViewProps) {
  if (loading || !stats) return <Skeleton rows={3} />;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total enviadas', value: stats.total },
          { label: 'Lidas', value: stats.read, color: 'text-emerald-600' },
          {
            label: 'Não lidas',
            value: stats.unread,
            color: stats.unread > 100 ? 'text-red-600' : 'text-amber-600',
          },
          {
            label: 'Taxa de abertura',
            value: `${stats.openRate}%`,
            color: 'text-blue-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Por categoria */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Por categoria
          </div>
          {stats.byCategory.map((c) => {
            const cfg = c.category ? CATEGORY_CFG[c.category] : null;
            return (
              <div
                key={c.category}
                className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm">{cfg?.icon ?? '📌'}</span>
                <span className="text-xs text-gray-700 flex-1">
                  {cfg?.label ?? c.category ?? '—'}
                </span>
                <span className="text-xs font-mono font-bold text-gray-900">
                  {c.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Envio em massa */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Enviar a todos
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Título (opcional)"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              rows={3}
              placeholder="Mensagem…"
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendAll}
              disabled={sending}
              className="w-full py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {sending ? 'A enviar…' : '📣 Enviar a todos os colaboradores'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
