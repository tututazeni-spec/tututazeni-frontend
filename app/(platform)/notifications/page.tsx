// src/app/(dashboard)/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  useNotificationsInbox,
  type ReadFilter,
} from '@/hooks/useNotificationsInbox';
import { useNotificationsAdmin } from '@/hooks/useNotificationsAdmin';
import { InboxView as InboxDetailView } from '@/components/notifications/InboxView';
import { AdminView as AdminDetailView } from '@/components/notifications/AdminView';
import { CATEGORY_CFG, Skeleton } from '@/components/notifications/shared';

// ─── Types ────────────────────────────────────────────────────────────────────
// Priority/Category/Notification/NotifData/Stats/AdminForm vivem em
// components/notifications/types.ts (partilhados com InboxView/NotifItem e
// AdminView).

interface Preferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  slack: boolean;
  sms: boolean;
  quietHourStart: number;
  quietHourEnd: number;
  digestFrequency: string;
  disabledCategories: string[];
}

type View = 'inbox' | 'preferences' | 'admin';

// timeAgo/PRIORITY_CFG/NotifItem vivem em components/notifications/
// InboxView.tsx (só usados aí); CATEGORY_CFG/Skeleton em
// components/notifications/shared.tsx (partilhados com PreferencesView/
// AdminView abaixo).

// ─── View: Inbox ──────────────────────────────────────────────────────────────

// Container: useNotificationsInbox trata a query + mutações; a apresentação
// (toolbar de filtros + lista) vive em components/notifications/InboxView.tsx.
function InboxView() {
  const [category, setCategory] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const { data, loading, handleRead, handleArchive, handleReadAll, marking } =
    useNotificationsInbox(category, readFilter);

  return (
    <InboxDetailView
      category={category}
      onCategoryChange={setCategory}
      readFilter={readFilter}
      onReadFilterChange={setReadFilter}
      data={data}
      loading={loading}
      onRead={handleRead}
      onArchive={handleArchive}
      onReadAll={handleReadAll}
      marking={marking}
    />
  );
}

// ─── View: Preferences ────────────────────────────────────────────────────────

function PreferencesView() {
  // Cache das preferências + cópia local editável (sincroniza quando chega).
  const { data, isLoading } = useApiQuery<Preferences>(
    queryKeys.notifications.preferences(),
    '/notifications/preferences',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const save = useApiMutation(
    () => apiClient.patch('/notifications/preferences', prefs),
    {
      invalidateKeys: [queryKeys.notifications.preferences()],
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (e) => alert(e.message),
    },
  );
  const saving = save.isPending;
  const handleSave = () => {
    if (prefs) save.mutate(undefined);
  };

  const toggle = (key: keyof Preferences) => {
    setPrefs((prev) => (prev ? { ...prev, [key]: !prev[key] } : null));
  };

  const toggleCategory = (cat: string) => {
    setPrefs((prev) => {
      if (!prev) return null;
      const disabled = prev.disabledCategories ?? [];
      const updated = disabled.includes(cat)
        ? disabled.filter((c) => c !== cat)
        : [...disabled, cat];
      return { ...prev, disabledCategories: updated };
    });
  };

  if (isLoading || !prefs) return <Skeleton rows={4} />;

  return (
    <div className="max-w-xl space-y-5">
      {/* Canais */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-4">
          Canais de notificação
        </div>
        {[
          {
            key: 'inApp' as const,
            label: 'In-app',
            sub: 'Centro de notificações da plataforma',
            icon: '🔔',
          },
          {
            key: 'email' as const,
            label: 'E-mail',
            sub: 'Receber notificações por e-mail',
            icon: '📧',
          },
          {
            key: 'push' as const,
            label: 'Push',
            sub: 'Notificações do browser/mobile',
            icon: '📱',
          },
          {
            key: 'slack' as const,
            label: 'Slack',
            sub: 'Integração com Slack',
            icon: '💬',
          },
        ].map(({ key, label, sub, icon }) => (
          <div
            key={key}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Horário silencioso */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-1">
          🌙 Horário silencioso
        </div>
        <div className="text-xs text-gray-400 mb-4">
          Sem notificações push/SMS neste período
        </div>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Das</div>
            <select
              value={prefs.quietHourStart}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, quietHourStart: parseInt(e.target.value) } : null,
                )
              }
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          <span className="text-gray-400 mt-5">às</span>
          <div>
            <div className="text-xs text-gray-400 mb-1">Às</div>
            <select
              value={prefs.quietHourEnd}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, quietHourEnd: parseInt(e.target.value) } : null,
                )
              }
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Digest */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">
          📋 Resumo periódico (Digest)
        </div>
        <div className="flex gap-2">
          {(['NONE', 'DAILY', 'WEEKLY'] as const).map((freq) => (
            <button
              key={freq}
              onClick={() =>
                setPrefs((p) => (p ? { ...p, digestFrequency: freq } : null))
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                prefs.digestFrequency === freq
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {
                { NONE: 'Desactivado', DAILY: 'Diário', WEEKLY: 'Semanal' }[
                  freq
                ]
              }
            </button>
          ))}
        </div>
      </div>

      {/* Categorias desactivadas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-1">
          🔕 Categorias silenciadas
        </div>
        <div className="text-xs text-gray-400 mb-4">
          Não receber notificações destas categorias
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CFG).map(([k, v]) => {
            const disabled = (prefs.disabledCategories ?? []).includes(k);
            return (
              <button
                key={k}
                onClick={() => toggleCategory(k)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  disabled
                    ? 'bg-red-50 text-red-600 line-through'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {v.icon} {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60'
        }`}
      >
        {saving ? 'A guardar…' : saved ? '✓ Guardado!' : 'Guardar preferências'}
      </button>
    </div>
  );
}

// ─── View: Admin ──────────────────────────────────────────────────────────────

// Container: useNotificationsAdmin trata stats + formulário de envio em
// massa; a apresentação (cards de stats + form) vive em
// components/notifications/AdminView.tsx.
function AdminView() {
  const { stats, loading, form, setForm, sending, handleSendAll } =
    useNotificationsAdmin();

  return (
    <AdminDetailView
      stats={stats}
      loading={loading}
      form={form}
      setForm={setForm}
      sending={sending}
      handleSendAll={handleSendAll}
    />
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'inbox', label: '🔔 Caixa de entrada' },
  { id: 'preferences', label: '⚙️ Preferências' },
  { id: 'admin', label: '📊 Admin' },
];

const TITLES: Record<View, string> = {
  inbox: 'Notificações',
  preferences: 'Preferências de notificação',
  admin: 'Gestão de notificações',
};

export default function NotificationsPage() {
  const [view, setView] = useState<View>('inbox');

  // Badge de não lidas com polling (60s). Key partilhada com as mutações do inbox.
  const { data: unreadData } = useApiQuery<{ count: number }>(
    queryKeys.notifications.unreadCount(),
    '/notifications/my/unread-count',
    { refetchInterval: 60_000 },
  );
  const unread = unreadData?.count ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {TITLES[view]}
            </h1>
            {view === 'inbox' && unread > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Centro de notificações
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {n.label}
            {n.id === 'inbox' && unread > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === 'inbox' && <InboxView />}
      {view === 'preferences' && <PreferencesView />}
      {view === 'admin' && <AdminView />}
    </div>
  );
}
