// src/app/(dashboard)/notifications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Category = 'LMS' | 'PDI' | 'PERFORMANCE' | 'HR' | 'ENGAGEMENT' | 'GAMIFICATION' | 'SYSTEM' | 'ONBOARDING' | 'KNOWLEDGE';

interface Notification {
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

interface NotifData {
  data: Notification[];
  grouped: {
    today:     Notification[];
    yesterday: Notification[];
    thisWeek:  Notification[];
    older:     Notification[];
  };
  total: number;
  unreadCount: number;
  totalPages: number;
}

interface Preferences {
  inApp: boolean;
  email: boolean;
  push:  boolean;
  slack: boolean;
  sms:   boolean;
  quietHourStart:    number;
  quietHourEnd:      number;
  digestFrequency:   string;
  disabledCategories:string[];
}

interface Stats {
  total: number; read: number; unread: number; openRate: number;
  byType: Array<{ type: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byPriority: Record<string, number>;
}

type View = 'inbox' | 'preferences' | 'admin';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora mesmo';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  return `há ${days} dias`;
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<Priority, { icon: string; cls: string; border: string }> = {
  LOW:      { icon: '○',  cls: 'text-gray-400',  border: 'border-gray-100' },
  MEDIUM:   { icon: '●',  cls: 'text-blue-500',  border: 'border-blue-100' },
  HIGH:     { icon: '▲',  cls: 'text-amber-500', border: 'border-amber-100' },
  CRITICAL: { icon: '🔴', cls: 'text-red-600',   border: 'border-red-200' },
};

const CATEGORY_CFG: Record<string, { icon: string; label: string; cls: string }> = {
  LMS:         { icon: '🎓', label: 'Aprendizagem',  cls: 'bg-blue-50 text-blue-700' },
  PDI:         { icon: '🎯', label: 'PDI',           cls: 'bg-purple-50 text-purple-700' },
  PERFORMANCE: { icon: '📊', label: 'Performance',   cls: 'bg-amber-50 text-amber-700' },
  HR:          { icon: '👤', label: 'RH',            cls: 'bg-emerald-50 text-emerald-700' },
  ENGAGEMENT:  { icon: '💬', label: 'Engagement',    cls: 'bg-pink-50 text-pink-700' },
  GAMIFICATION:{ icon: '🏆', label: 'Gamificação',   cls: 'bg-yellow-50 text-yellow-700' },
  SYSTEM:      { icon: '⚙️', label: 'Sistema',       cls: 'bg-gray-100 text-gray-600' },
  ONBOARDING:  { icon: '🚀', label: 'Onboarding',    cls: 'bg-teal-50 text-teal-700' },
  KNOWLEDGE:   { icon: '📚', label: 'Conhecimento',  cls: 'bg-indigo-50 text-indigo-700' },
};

// ─── Notification Item ────────────────────────────────────────────────────────

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
  const catCfg      = notif.category ? CATEGORY_CFG[notif.category] : null;

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
              <div className={`text-sm font-semibold mb-0.5 ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notif.title}
              </div>
            )}
            <p className={`text-sm leading-relaxed ${!notif.read ? 'text-gray-800' : 'text-gray-500'}`}>
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
          <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>

          {notif.actionUrl && (
            <a href={notif.actionUrl}
              className="text-xs text-blue-600 hover:underline font-medium"
              onClick={() => !notif.read && onRead(notif.id)}
            >
              {notif.actionLabel ?? 'Ver →'}
            </a>
          )}

          {/* Acções hover */}
          <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.read && (
              <button onClick={() => onRead(notif.id)}
                className="text-xs text-blue-600 hover:text-blue-800">
                Marcar lida
              </button>
            )}
            <button onClick={() => onArchive(notif.id)}
              className="text-xs text-gray-400 hover:text-gray-600">
              Arquivar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: Inbox ──────────────────────────────────────────────────────────────

function InboxView() {
  const [data, setData]         = useState<NotifData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [marking, setMarking]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...(category ? { category } : {}), ...(readFilter !== 'all' ? { read: String(readFilter === 'read') } : {}) });
      setData(await apiFetch(`/notifications/my?${params}`));
    } finally { setLoading(false); }
  }, [category, readFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (id: number) => {
    await apiFetch(`/notifications/my/${id}/read`, { method: 'PATCH', body: '{}' }).catch(() => {});
    setData(prev => prev ? {
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      data: prev.data.map(n => n.id === id ? { ...n, read: true } : n),
      grouped: {
        today:     prev.grouped.today.map(n => n.id === id ? { ...n, read: true } : n),
        yesterday: prev.grouped.yesterday.map(n => n.id === id ? { ...n, read: true } : n),
        thisWeek:  prev.grouped.thisWeek.map(n => n.id === id ? { ...n, read: true } : n),
        older:     prev.grouped.older.map(n => n.id === id ? { ...n, read: true } : n),
      },
    } : null);
  };

  const handleArchive = async (id: number) => {
    await apiFetch(`/notifications/my/${id}/archive`, { method: 'PATCH', body: '{}' }).catch(() => {});
    await load();
  };

  const handleReadAll = async () => {
    setMarking(true);
    await apiFetch('/notifications/my/read-all', { method: 'PATCH', body: '{}' }).catch(() => {});
    await load();
    setMarking(false);
  };

  const renderGroup = (label: string, items: Notification[]) => {
    if (!items.length) return null;
    return (
      <div key={label}>
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
          {label}
        </div>
        {items.map(n => (
          <NotifItem key={n.id} notif={n} onRead={handleRead} onArchive={handleArchive} />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Category filter */}
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        {/* Read filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setReadFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                readFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ all: 'Todas', unread: 'Não lidas', read: 'Lidas' }[f]}
            </button>
          ))}
        </div>

        {data && data.unreadCount > 0 && (
          <button onClick={handleReadAll} disabled={marking}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">
            {marking ? 'A marcar…' : `Marcar todas como lidas (${data.unreadCount})`}
          </button>
        )}
      </div>

      {loading ? <Skeleton /> : !data ? null : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.data.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🔔</div>
              <div className="text-sm text-gray-400">Nenhuma notificação encontrada</div>
            </div>
          ) : (
            <>
              {renderGroup('Hoje',       data.grouped.today)}
              {renderGroup('Ontem',      data.grouped.yesterday)}
              {renderGroup('Esta semana',data.grouped.thisWeek)}
              {renderGroup('Antigas',    data.grouped.older)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Preferences ────────────────────────────────────────────────────────

function PreferencesView() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    apiFetch<Preferences>('/notifications/preferences').then(setPrefs).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await apiFetch('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(prefs) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggle = (key: keyof Preferences) => {
    setPrefs(prev => prev ? { ...prev, [key]: !prev[key] } : null);
  };

  const toggleCategory = (cat: string) => {
    setPrefs(prev => {
      if (!prev) return null;
      const disabled = prev.disabledCategories ?? [];
      const updated  = disabled.includes(cat) ? disabled.filter(c => c !== cat) : [...disabled, cat];
      return { ...prev, disabledCategories: updated };
    });
  };

  if (loading || !prefs) return <Skeleton rows={4} />;

  return (
    <div className="max-w-xl space-y-5">
      {/* Canais */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-4">Canais de notificação</div>
        {[
          { key: 'inApp' as const, label: 'In-app', sub: 'Centro de notificações da plataforma', icon: '🔔' },
          { key: 'email' as const, label: 'E-mail', sub: 'Receber notificações por e-mail',       icon: '📧' },
          { key: 'push'  as const, label: 'Push',   sub: 'Notificações do browser/mobile',         icon: '📱' },
          { key: 'slack' as const, label: 'Slack',  sub: 'Integração com Slack',                   icon: '💬' },
        ].map(({ key, label, sub, icon }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
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
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Horário silencioso */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-1">🌙 Horário silencioso</div>
        <div className="text-xs text-gray-400 mb-4">Sem notificações push/SMS neste período</div>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Das</div>
            <select
              value={prefs.quietHourStart}
              onChange={e => setPrefs(p => p ? { ...p, quietHourStart: parseInt(e.target.value) } : null)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <span className="text-gray-400 mt-5">às</span>
          <div>
            <div className="text-xs text-gray-400 mb-1">Às</div>
            <select
              value={prefs.quietHourEnd}
              onChange={e => setPrefs(p => p ? { ...p, quietHourEnd: parseInt(e.target.value) } : null)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Digest */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">📋 Resumo periódico (Digest)</div>
        <div className="flex gap-2">
          {(['NONE', 'DAILY', 'WEEKLY'] as const).map(freq => (
            <button key={freq} onClick={() => setPrefs(p => p ? { ...p, digestFrequency: freq } : null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                prefs.digestFrequency === freq ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {{ NONE: 'Desactivado', DAILY: 'Diário', WEEKLY: 'Semanal' }[freq]}
            </button>
          ))}
        </div>
      </div>

      {/* Categorias desactivadas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-1">🔕 Categorias silenciadas</div>
        <div className="text-xs text-gray-400 mb-4">Não receber notificações destas categorias</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CFG).map(([k, v]) => {
            const disabled = (prefs.disabledCategories ?? []).includes(k);
            return (
              <button key={k} onClick={() => toggleCategory(k)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  disabled ? 'bg-red-50 text-red-600 line-through' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          saved ? 'bg-emerald-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60'
        }`}
      >
        {saving ? 'A guardar…' : saved ? '✓ Guardado!' : 'Guardar preferências'}
      </button>
    </div>
  );
}

// ─── View: Admin ──────────────────────────────────────────────────────────────

function AdminView() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm]       = useState({ type: 'ANNOUNCEMENT', message: '', title: '' });

  useEffect(() => {
    apiFetch<Stats>('/notifications/stats').then(setStats).finally(() => setLoading(false));
  }, []);

  const handleSendAll = async () => {
    if (!form.message.trim()) { alert('Mensagem obrigatória'); return; }
    setSending(true);
    try {
      const res: any = await apiFetch('/notifications/send-all', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      alert(`✓ Enviado a ${res.sent} colaboradores`);
      setForm({ type: 'ANNOUNCEMENT', message: '', title: '' });
    } catch (e: any) { alert(e.message); }
    finally { setSending(false); }
  };

  if (loading || !stats) return <Skeleton rows={3} />;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total enviadas',  value: stats.total },
          { label: 'Lidas',          value: stats.read,    color: 'text-emerald-600' },
          { label: 'Não lidas',       value: stats.unread,  color: stats.unread > 100 ? 'text-red-600' : 'text-amber-600' },
          { label: 'Taxa de abertura',value: `${stats.openRate}%`, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Por categoria */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Por categoria</div>
          {stats.byCategory.map(c => {
            const cfg = c.category ? CATEGORY_CFG[c.category] : null;
            return (
              <div key={c.category} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm">{cfg?.icon ?? '📌'}</span>
                <span className="text-xs text-gray-700 flex-1">{cfg?.label ?? c.category ?? '—'}</span>
                <span className="text-xs font-mono font-bold text-gray-900">{c.count}</span>
              </div>
            );
          })}
        </div>

        {/* Envio em massa */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Enviar a todos</div>
          <div className="space-y-3">
            <input
              type="text" placeholder="Título (opcional)"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              rows={3} placeholder="Mensagem…"
              value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendAll} disabled={sending}
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

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'inbox',       label: '🔔 Caixa de entrada' },
  { id: 'preferences', label: '⚙️ Preferências' },
  { id: 'admin',       label: '📊 Admin' },
];

const TITLES: Record<View, string> = {
  inbox:       'Notificações',
  preferences: 'Preferências de notificação',
  admin:       'Gestão de notificações',
};

export default function NotificationsPage() {
  const [view, setView]       = useState<View>('inbox');
  const [unread, setUnread]   = useState(0);

  useEffect(() => {
    apiFetch<{ count: number }>('/notifications/my/unread-count')
      .then(r => setUnread(r.count))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
            {view === 'inbox' && unread > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Centro de notificações</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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

      {view === 'inbox'       && <InboxView />}
      {view === 'preferences' && <PreferencesView />}
      {view === 'admin'       && <AdminView />}
    </div>
  );
}