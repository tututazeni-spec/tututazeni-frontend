// src/app/(dashboard)/events/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'TRAINING' | 'WORKSHOP' | 'WEBINAR' | 'LIVE_CLASS' | 'HACKATHON' | 'MENTORING' | 'CORPORATE' | 'ONBOARDING' | 'NETWORKING' | 'EXTERNAL' | 'TALK';
type EventModalidade = 'ONLINE' | 'PRESENCIAL' | 'HYBRID';
type EventStatus = 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'CANCELLED';
type ParticipantStatus = 'PENDING' | 'CONFIRMED' | 'WAITLIST' | 'PRESENT' | 'ABSENT' | 'CANCELLED' | 'NO_SHOW';

interface Event {
  id: number;
  title: string;
  description: string | null;
  type: EventType;
  modalidade: EventModalidade;
  status: EventStatus;
  startAt: string;
  endAt: string;
  location: string | null;
  meetingUrl: string | null;
  meetingPassword: string | null;
  maxCapacity: number;
  waitlistEnabled: boolean;
  certificateEnabled: boolean;
  mandatory: boolean;
  bannerUrl: string | null;
  tags: string[];
  isFull: boolean;
  occupancyRate: number | null;
  avgNps?: number | null;
  avgRating?: number | null;
  organizer: { id: number; fullName: string; avatarUrl: string | null };
  _count: { participants: number; feedbacks?: number };
}

interface MyEvents {
  upcoming: Array<{ id: number; status: ParticipantStatus; event: Event }>;
  past:     Array<{ id: number; status: ParticipantStatus; event: Event }>;
}

interface OrganizerDashboard {
  metrics: { totalEvents: number; upcomingEvents: number; totalParticipants: number; totalFeedbacks: number; avgNps: number | null };
  events:  Array<{ id: number; title: string; type: string; status: string; startAt: string; participants: number; maxCapacity: number; occupancyRate: number | null; feedbackCount: number; avgNps: number | null }>;
}

type View = 'catalog' | 'my-events' | 'detail' | 'organizer' | 'create';

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<EventType, { icon: string; label: string; cls: string }> = {
  TRAINING:   { icon: '📚', label: 'Treinamento',       cls: 'bg-blue-50 text-blue-700' },
  WORKSHOP:   { icon: '🛠',  label: 'Workshop',          cls: 'bg-amber-50 text-amber-700' },
  WEBINAR:    { icon: '💻', label: 'Webinar',            cls: 'bg-purple-50 text-purple-700' },
  LIVE_CLASS: { icon: '🎓', label: 'Aula ao vivo',      cls: 'bg-emerald-50 text-emerald-700' },
  HACKATHON:  { icon: '⚡', label: 'Hackathon',          cls: 'bg-red-50 text-red-700' },
  MENTORING:  { icon: '👥', label: 'Mentoria',           cls: 'bg-pink-50 text-pink-700' },
  CORPORATE:  { icon: '🏢', label: 'Corporativo',        cls: 'bg-gray-100 text-gray-600' },
  ONBOARDING: { icon: '🚀', label: 'Onboarding',         cls: 'bg-teal-50 text-teal-700' },
  NETWORKING: { icon: '🤝', label: 'Networking',         cls: 'bg-indigo-50 text-indigo-700' },
  EXTERNAL:   { icon: '🌐', label: 'Evento externo',    cls: 'bg-orange-50 text-orange-700' },
  TALK:       { icon: '🎤', label: 'Talk',              cls: 'bg-violet-50 text-violet-700' },
};

const MODALITY_CFG: Record<EventModalidade, { icon: string; label: string }> = {
  ONLINE:     { icon: '💻', label: 'Online' },
  PRESENCIAL: { icon: '🏢', label: 'Presencial' },
  HYBRID:     { icon: '🔀', label: 'Híbrido' },
};

const STATUS_CFG: Record<EventStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Rascunho',   cls: 'bg-gray-100 text-gray-500' },
  PUBLISHED: { label: 'Publicado',  cls: 'bg-blue-50 text-blue-700' },
  LIVE:      { label: 'Ao vivo 🔴', cls: 'bg-red-50 text-red-700' },
  ENDED:     { label: 'Encerrado',  cls: 'bg-gray-100 text-gray-400' },
  CANCELLED: { label: 'Cancelado',  cls: 'bg-red-50 text-red-500' },
};

const PARTICIPANT_STATUS: Record<ParticipantStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendente',         cls: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmado ✓',     cls: 'bg-emerald-50 text-emerald-700' },
  WAITLIST:  { label: 'Lista de espera',  cls: 'bg-blue-50 text-blue-700' },
  PRESENT:   { label: 'Presente ✅',      cls: 'bg-emerald-50 text-emerald-700' },
  ABSENT:    { label: 'Ausente',          cls: 'bg-red-50 text-red-600' },
  CANCELLED: { label: 'Cancelado',        cls: 'bg-gray-100 text-gray-400' },
  NO_SHOW:   { label: 'Não apareceu',     cls: 'bg-red-100 text-red-700' },
};

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onSelect, myStatus }: { event: Event; onSelect: () => void; myStatus?: ParticipantStatus }) {
  const typeCfg     = TYPE_CFG[event.type]         ?? TYPE_CFG.TRAINING;
  const modalityCfg = MODALITY_CFG[event.modalidade] ?? MODALITY_CFG.ONLINE;
  const statusCfg   = STATUS_CFG[event.status]     ?? STATUS_CFG.PUBLISHED;

  return (
    <div
      onClick={onSelect}
      className={`bg-white border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all ${
        event.status === 'LIVE' ? 'border-red-300' : 'border-gray-200 hover:border-blue-200'
      }`}
    >
      {/* Banner / Header */}
      <div className={`h-2 ${typeCfg.cls.includes('blue') ? 'bg-blue-500' : typeCfg.cls.includes('amber') ? 'bg-amber-500' : typeCfg.cls.includes('emerald') ? 'bg-emerald-500' : typeCfg.cls.includes('purple') ? 'bg-purple-500' : 'bg-gray-400'}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded ${typeCfg.cls}`}>{typeCfg.icon} {typeCfg.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${statusCfg.cls}`}>{statusCfg.label}</span>
            {event.mandatory && <span className="text-xs text-red-600 font-medium">Obrigatório</span>}
          </div>
        </div>

        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{event.title}</div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span>{modalityCfg.icon} {modalityCfg.label}</span>
          <span>📅 {fmtDateTime(event.startAt)}</span>
          {event.location && <span>📍 {event.location}</span>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar name={event.organizer.fullName} avatarUrl={event.organizer.avatarUrl} size="sm" />
            <span className="text-xs text-gray-500">{event.organizer.fullName}</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs">
              <span className={`font-medium ${event.isFull ? 'text-red-600' : 'text-gray-500'}`}>
                {event._count.participants}/{event.maxCapacity}
              </span>
              {event.isFull && <span className="text-red-600">• Lotado</span>}
            </div>
            {myStatus && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${PARTICIPANT_STATUS[myStatus]?.cls ?? 'bg-gray-100 text-gray-400'}`}>
                {PARTICIPANT_STATUS[myStatus]?.label}
              </span>
            )}
          </div>
        </div>

        {/* Barra de ocupação */}
        {event.occupancyRate !== null && (
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${event.occupancyRate >= 90 ? 'bg-red-500' : event.occupancyRate >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(event.occupancyRate, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Catalog ────────────────────────────────────────────────────────────

function CatalogView({ onSelect }: { onSelect: (id: number) => void }) {
  const [data, setData]     = useState<{ data: Event[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter]         = useState('');
  const [modalityFilter, setModalityFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      upcoming: 'true',
      ...(typeFilter     ? { type:      typeFilter }     : {}),
      ...(modalityFilter ? { modalidade:modalityFilter } : {}),
    });
    apiFetch<any>(`/events?${params}`).then(setData).finally(() => setLoading(false));
  }, [typeFilter, modalityFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <div className="flex gap-1">
          {Object.entries(MODALITY_CFG).map(([k, v]) => (
            <button key={k} onClick={() => setModalityFilter(modalityFilter === k ? '' : k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${modalityFilter === k ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        <span className="ml-auto self-center text-xs text-gray-400">{data?.total ?? 0} eventos</span>
      </div>

      {loading ? <Skeleton rows={4} /> : (
        <div className="grid grid-cols-2 gap-4">
          {(data?.data ?? []).map(e => (
            <EventCard key={e.id} event={e} onSelect={() => onSelect(e.id)} />
          ))}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <div className="text-4xl mb-3">📅</div>
              Sem eventos encontrados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: My Events ──────────────────────────────────────────────────────────

function MyEventsView({ onSelect }: { onSelect: (id: number) => void }) {
  const [data, setData]     = useState<MyEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    apiFetch<MyEvents>('/events/my').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const items = tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.past ?? []);

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {{ upcoming: `📅 Próximos (${data?.upcoming.length ?? 0})`, past: `🕐 Passados (${data?.past.length ?? 0})` }[t]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          {tab === 'upcoming' ? 'Sem eventos futuros. Inscreve-te no catálogo!' : 'Sem eventos passados'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map(p => (
            <EventCard
              key={p.id}
              event={p.event}
              myStatus={p.status}
              onSelect={() => onSelect(p.event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Event Detail ───────────────────────────────────────────────────────

function DetailView({ eventId, onBack }: { eventId: number; onBack: () => void }) {
  const [event, setEvent]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ nps: 8, rating: 4, comment: '' });
  const [submitFeedback, setSubmitFeedback] = useState(false);
  const [tab, setTab]         = useState<'info' | 'participants'>('info');

  useEffect(() => {
    apiFetch<any>(`/events/${eventId}`).then(setEvent).finally(() => setLoading(false));
  }, [eventId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await apiFetch(`/events/${eventId}/join`, { method: 'POST', body: '{}' });
      const e = await apiFetch<any>(`/events/${eventId}`);
      setEvent(e);
    } catch (e: any) { alert(e.message); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!confirm('Cancelar inscrição neste evento?')) return;
    try {
      await apiFetch(`/events/${eventId}/leave`, { method: 'POST', body: '{}' });
      const e = await apiFetch<any>(`/events/${eventId}`);
      setEvent(e);
    } catch (e: any) { alert(e.message); }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await apiFetch('/events/checkin', { method: 'POST', body: JSON.stringify({ eventId }) });
      const e = await apiFetch<any>(`/events/${eventId}`);
      setEvent(e);
      alert('✅ Check-in realizado! +20 XP');
    } catch (e: any) { alert(e.message); }
    finally { setCheckingIn(false); }
  };

  const handleFeedback = async () => {
    setSubmitFeedback(true);
    try {
      await apiFetch(`/events/${eventId}/feedback`, { method: 'POST', body: JSON.stringify(feedback) });
      setShowFeedback(false);
      alert('✅ Feedback enviado! Obrigado pela tua avaliação.');
    } catch (e: any) { alert(e.message); }
    finally { setSubmitFeedback(false); }
  };

  if (loading || !event) return <Skeleton rows={6} />;

  const typeCfg     = TYPE_CFG[event.type as EventType]          ?? TYPE_CFG.TRAINING;
  const modalityCfg = MODALITY_CFG[event.modalidade as EventModalidade] ?? MODALITY_CFG.ONLINE;
  const statusCfg   = STATUS_CFG[event.status as EventStatus]    ?? STATUS_CFG.PUBLISHED;
  const isLive      = event.status === 'LIVE';

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        ← Voltar
      </button>

      {/* Header */}
      <div className={`bg-white border rounded-xl p-6 mb-5 ${isLive ? 'border-red-300' : 'border-gray-200'}`}>
        {isLive && (
          <div className="flex items-center gap-2 mb-3 text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold">Evento ao vivo agora</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded ${typeCfg.cls}`}>{typeCfg.icon} {typeCfg.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusCfg.cls}`}>{statusCfg.label}</span>
              <span className="text-xs text-gray-400">{modalityCfg.icon} {modalityCfg.label}</span>
              {event.mandatory && <span className="text-xs text-red-600 font-semibold">Obrigatório</span>}
              {event.certificateEnabled && <span className="text-xs text-emerald-600">🎓 Certificado</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h1>
            {event.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{event.description}</p>}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {event.status === 'PUBLISHED' && (
              <button onClick={handleJoin} disabled={joining}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${event.isFull && !event.waitlistEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60'}`}>
                {joining ? '…' : event.isFull ? (event.waitlistEnabled ? 'Entrar na lista de espera' : 'Lotado') : '+ Inscrever-me'}
              </button>
            )}
            {(event.status === 'LIVE' || event.status === 'PUBLISHED') && event.meetingUrl && (
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 text-center">
                🔴 Entrar no evento
              </a>
            )}
            <button onClick={handleCheckIn} disabled={checkingIn}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
              {checkingIn ? '…' : '✓ Check-in'}
            </button>
            {event.status === 'ENDED' && (
              <button onClick={() => setShowFeedback(s => !s)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                ⭐ Avaliar evento
              </button>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
          <span>📅 {fmtDateTime(event.startAt)} → {fmtDateTime(event.endAt)}</span>
          {event.location && <span>📍 {event.location}</span>}
          <span>👥 {event._count.participants}/{event.maxCapacity} inscritos</span>
          {event.avgNps && <span>NPS: {event.avgNps}/10</span>}
          {event.avgRating && <span>⭐ {event.avgRating}/5</span>}
        </div>

        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {event.tags.map((t: string) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de feedback */}
      {showFeedback && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">Avalia este evento</div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">NPS — Recomendarias este evento a um colega? (1-10)</div>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setFeedback(f => ({ ...f, nps: n }))}
                    className={`w-8 h-8 text-xs rounded-lg font-mono transition-colors ${feedback.nps === n ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Avaliação geral (1-5)</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setFeedback(f => ({ ...f, rating: n }))}
                    className={`text-2xl transition-colors ${n <= feedback.rating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}>★</button>
                ))}
              </div>
            </div>
            <textarea rows={3} placeholder="Comentário (opcional)…"
              value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleFeedback} disabled={submitFeedback}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-60">
              {submitFeedback ? 'A enviar…' : '✓ Enviar avaliação'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {([
          { id: 'info',         label: 'ℹ️ Informações' },
          { id: 'participants', label: `👥 Participantes (${event._count.participants})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={event.organizer.fullName} avatarUrl={event.organizer.avatarUrl} size="md" />
            <div>
              <div className="text-sm font-medium text-gray-900">Organizado por</div>
              <div className="text-sm text-gray-500">{event.organizer.fullName}</div>
            </div>
          </div>
          {event.meetingPassword && (
            <div className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
              🔑 Senha do meeting: <span className="font-mono font-bold">{event.meetingPassword}</span>
            </div>
          )}
        </div>
      )}

      {tab === 'participants' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {(event.participants ?? []).map((p: any) => (
            <div key={p.userId} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={p.user?.fullName ?? 'U'} avatarUrl={p.user?.avatarUrl} size="sm" />
              <div className="flex-1 text-sm text-gray-800">{p.user?.fullName}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${PARTICIPANT_STATUS[p.status as ParticipantStatus]?.cls ?? 'bg-gray-100 text-gray-400'}`}>
                {PARTICIPANT_STATUS[p.status as ParticipantStatus]?.label ?? p.status}
              </span>
            </div>
          ))}
          {(event.participants ?? []).length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Sem participantes inscritos</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Organizer Dashboard ────────────────────────────────────────────────

function OrganizerView() {
  const [data, setData]     = useState<OrganizerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OrganizerDashboard>('/events/organizer/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de eventos',  value: data.metrics.totalEvents },
          { label: 'Próximos',          value: data.metrics.upcomingEvents,      color: 'text-blue-600' },
          { label: 'Total participantes', value: data.metrics.totalParticipants, color: 'text-emerald-600' },
          { label: 'NPS médio',         value: data.metrics.avgNps ? `${data.metrics.avgNps}/10` : '—', color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Eventos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Os meus eventos
        </div>
        {data.events.map(e => {
          const statusCfg = STATUS_CFG[e.status as EventStatus] ?? STATUS_CFG.PUBLISHED;
          return (
            <div key={e.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{e.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${statusCfg.cls}`}>{statusCfg.label}</span>
                </div>
                <div className="text-xs text-gray-400">{fmtDate(e.startAt)}</div>
                {e.maxCapacity > 0 && (
                  <div className="mt-1 w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(e.occupancyRate ?? 0) >= 90 ? 'bg-red-400' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(e.occupancyRate ?? 0, 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900">{e.participants}/{e.maxCapacity}</div>
                <div className="text-xs text-gray-400">{e.occupancyRate ?? 0}% ocupação</div>
                {e.avgNps && <div className="text-xs text-amber-600">NPS {e.avgNps}/10</div>}
              </div>
            </div>
          );
        })}
        {data.events.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Sem eventos criados</div>
        )}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV = [
  { id: 'catalog',   label: '📅 Catálogo' },
  { id: 'my-events', label: '🎫 Os meus eventos' },
  { id: 'organizer', label: '📊 Organizador' },
] as const;

const TITLES: Record<View, string> = {
  catalog:   'Eventos Corporativos',
  'my-events':'Os meus Eventos',
  detail:    'Detalhe do Evento',
  organizer: 'Dashboard Organizador',
  create:    'Criar Evento',
};

export default function EventsPage() {
  const [view, setView]       = useState<View>('catalog');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack   = () => { setSelectedId(null); setView('catalog'); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Eventos Corporativos</p>
        </div>
        {view !== 'detail' && (
          <button onClick={() => alert('Abrir formulário de criação de evento')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800">
            + Criar evento
          </button>
        )}
        {view === 'detail' && (
          <button onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
            ← Voltar
          </button>
        )}
      </div>

      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'catalog'    && <CatalogView   onSelect={handleSelect} />}
      {view === 'my-events'  && <MyEventsView  onSelect={handleSelect} />}
      {view === 'organizer'  && <OrganizerView />}
      {view === 'detail' && selectedId !== null && <DetailView eventId={selectedId} onBack={handleBack} />}
    </div>
  );
}