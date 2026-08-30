// app/(platform)/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

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
  const notify = useToast();
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      <Card className="p-5">
        <div className="mb-4 font-display text-sm font-semibold text-ink">
          Canais de notificação
        </div>
        {[
          {
            key: 'inApp' as const,
            label: 'In-app',
            sub: 'Centro de notificações da plataforma',
          },
          {
            key: 'email' as const,
            label: 'E-mail',
            sub: 'Receber notificações por e-mail',
          },
          {
            key: 'push' as const,
            label: 'Push',
            sub: 'Notificações do browser/mobile',
          },
          {
            key: 'slack' as const,
            label: 'Slack',
            sub: 'Integração com Slack',
          },
        ].map(({ key, label, sub }) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-border py-3 last:border-0"
          >
            <div>
              <div className="font-body text-sm font-medium text-ink">
                {label}
              </div>
              <div className="font-body text-xs text-ink-faint">{sub}</div>
            </div>
            <button
              onClick={() => toggle(key)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-pill transition-colors',
                prefs[key] ? 'bg-primary' : 'bg-border-strong',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-surface shadow-resting transition-transform',
                  prefs[key] ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>
        ))}
      </Card>

      {/* Horário silencioso */}
      <Card className="p-5">
        <div className="mb-1 font-display text-sm font-semibold text-ink">
          Horário silencioso
        </div>
        <div className="mb-4 font-body text-xs text-ink-faint">
          Sem notificações push/SMS neste período
        </div>
        <div className="flex items-center gap-3">
          <div>
            <div className="mb-1 font-body text-xs text-ink-faint">Das</div>
            <select
              value={prefs.quietHourStart}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, quietHourStart: parseInt(e.target.value) } : null,
                )
              }
              className="rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5 font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          <span className="mt-5 font-body text-sm text-ink-faint">às</span>
          <div>
            <div className="mb-1 font-body text-xs text-ink-faint">Às</div>
            <select
              value={prefs.quietHourEnd}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, quietHourEnd: parseInt(e.target.value) } : null,
                )
              }
              className="rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5 font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Digest */}
      <Card className="p-5">
        <div className="mb-3 font-display text-sm font-semibold text-ink">
          Resumo periódico
        </div>
        <div className="flex gap-2">
          {(['NONE', 'DAILY', 'WEEKLY'] as const).map((freq) => (
            <Button
              key={freq}
              size="sm"
              intent={prefs.digestFrequency === freq ? 'primary' : 'ghost'}
              onClick={() =>
                setPrefs((p) => (p ? { ...p, digestFrequency: freq } : null))
              }
            >
              {
                { NONE: 'Desactivado', DAILY: 'Diário', WEEKLY: 'Semanal' }[
                  freq
                ]
              }
            </Button>
          ))}
        </div>
      </Card>

      {/* Categorias desactivadas */}
      <Card className="p-5">
        <div className="mb-1 font-display text-sm font-semibold text-ink">
          Categorias silenciadas
        </div>
        <div className="mb-4 font-body text-xs text-ink-faint">
          Não receber notificações destas categorias
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CFG).map(([k, v]) => {
            const disabled = (prefs.disabledCategories ?? []).includes(k);
            return (
              <button
                key={k}
                onClick={() => toggleCategory(k)}
                className={cn(
                  'rounded-pill px-3 py-1.5 font-body text-xs font-medium transition-all',
                  disabled
                    ? 'bg-danger-subtle text-danger-ink line-through'
                    : 'bg-surface-sunken text-ink-muted hover:bg-border',
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Button
        className={cn(
          'w-full',
          saved && 'bg-success hover:bg-success active:bg-success',
        )}
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? 'A guardar…' : saved ? '✓ Guardado!' : 'Guardar preferências'}
      </Button>
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-semibold text-ink">
              {TITLES[view]}
            </h1>
            {view === 'inbox' && unread > 0 && (
              <span className="rounded-pill bg-primary px-2 py-0.5 font-body text-xs font-bold text-canvas">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-6 w-fit">
          <TabsTrigger value="inbox" className="gap-1.5">
            Caixa de entrada
            {unread > 0 && (
              <span className="rounded-pill bg-primary px-1.5 py-0.5 font-body text-[10px] font-bold text-canvas">
                {unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <InboxView />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesView />
        </TabsContent>
        <TabsContent value="admin">
          <AdminView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
