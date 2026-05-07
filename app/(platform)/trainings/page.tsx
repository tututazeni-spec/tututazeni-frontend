// src/app/(dashboard)/trainings/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrainingType   = 'PRESENTIAL' | 'ONLINE' | 'HYBRID';
type TrainingLevel  = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type TrainingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type ParticipantStatus = 'WAITLIST' | 'REGISTERED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED' | 'COMPLETED';

interface Training {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  type: TrainingType;
  level: TrainingLevel;
  status: TrainingStatus;
  category: string | null;
  tags: string[];
  language: string;
  workloadHours: number | null;
  thumbnailUrl: string | null;
  mandatory: boolean;
  issueCertificate: boolean;
  cost: number | null;
  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  instructor: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null } | null;
  avgRating?: number;
  sessions?: Session[];
  ratings?: Rating[];
  _count: { sessions: number; participants: number; ratings: number };
}

interface Session {
  id: number;
  sessionDate: string;
  sessionEndDate: string | null;
  durationMinutes: number;
  modality: string;
  location: string | null;
  meetingUrl: string | null;
  maxParticipants: number;
  waitlistEnabled: boolean;
  _count: { participants: number };
}

interface Participant {
  id: number;
  status: ParticipantStatus;
  finalScore: number | null;
  attendedHours: number | null;
  completedAt: string | null;
  createdAt: string;
  user: { id: number; fullName: string; email: string; avatarUrl: string | null; department: { name: string } | null };
}

interface Rating {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: number; fullName: string; avatarUrl: string | null };
}

interface Dashboard {
  trainings: { total: number; published: number; mandatory: number };
  participants: { total: number; completed: number };
  completionRate: number;
  avgRating: number;
  topTrainings: Training[];
}

type View = 'catalog' | 'detail' | 'my-trainings' | 'dashboard';

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

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtHours(h: number | null) {
  if (!h) return '—';
  return h < 1 ? `${h * 60}min` : `${h}h`;
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<TrainingType, { label: string; icon: string; cls: string }> = {
  PRESENTIAL: { label: 'Presencial', icon: '🏫', cls: 'bg-blue-50 text-blue-700' },
  ONLINE:     { label: 'Online',     icon: '💻', cls: 'bg-purple-50 text-purple-700' },
  HYBRID:     { label: 'Híbrido',    icon: '🔀', cls: 'bg-amber-50 text-amber-700' },
};

const LEVEL_CFG: Record<TrainingLevel, { label: string; cls: string }> = {
  BEGINNER:     { label: 'Básico',      cls: 'bg-emerald-50 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio',  cls: 'bg-amber-50 text-amber-700' },
  ADVANCED:     { label: 'Avançado',    cls: 'bg-red-50 text-red-700' },
};

const PARTICIPANT_CFG: Record<ParticipantStatus, { label: string; cls: string }> = {
  WAITLIST:   { label: 'Lista espera', cls: 'bg-gray-100 text-gray-500' },
  REGISTERED: { label: 'Inscrito',    cls: 'bg-blue-50 text-blue-700' },
  ATTENDED:   { label: 'Presente',    cls: 'bg-emerald-50 text-emerald-700' },
  ABSENT:     { label: 'Ausente',     cls: 'bg-red-50 text-red-700' },
  CANCELLED:  { label: 'Cancelado',   cls: 'bg-gray-100 text-gray-400' },
  COMPLETED:  { label: 'Concluído',   cls: 'bg-emerald-100 text-emerald-800' },
};

function StarRating({ value }: { value: number | null }) {
  if (!value) return <span className="text-xs text-gray-300">Sem avaliação</span>;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-sm ${i < Math.round(value) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-0.5">{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Training Card ────────────────────────────────────────────────────────────

function TrainingCard({ training, onClick }: { training: Training; onClick: () => void }) {
  const typeCfg  = TYPE_CFG[training.type];
  const levelCfg = LEVEL_CFG[training.level];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-900 relative overflow-hidden">
        {training.thumbnailUrl ? (
          <img src={training.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            {typeCfg.icon}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}>{typeCfg.icon} {typeCfg.label}</span>
        </div>
        {training.mandatory && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">Obrigatório</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {training.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">{training.category}</div>
        )}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {training.title}
        </div>
        {training.shortDescription && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{training.shortDescription}</p>
        )}

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded ${levelCfg.cls}`}>{levelCfg.label}</span>
          <span className="text-xs text-gray-400">⏱ {fmtHours(training.workloadHours)}</span>
          {training.issueCertificate && <span className="text-xs text-amber-600">🏆 Certificado</span>}
        </div>

        {training.instructor && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar name={training.instructor.fullName} avatarUrl={training.instructor.avatarUrl} size="sm" />
            <span className="text-xs text-gray-500">{training.instructor.fullName}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <StarRating value={training.avgRating ?? null} />
          <span className="text-xs text-gray-400">{training._count.participants} inscritos</span>
        </div>
      </div>
    </div>
  );
}

// ─── View: Catalog ────────────────────────────────────────────────────────────

function CatalogView({ onSelect }: { onSelect: (id: number) => void }) {
  const [data, setData]       = useState<{ data: Training[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType]       = useState<TrainingType | ''>('');
  const [level, setLevel]     = useState<TrainingLevel | ''>('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '12',
        ...(type   ? { type }   : {}),
        ...(level  ? { level }  : {}),
        ...(search ? { search } : {}),
      });
      setData(await apiFetch(`/trainings?${params}`));
    } finally { setLoading(false); }
  }, [type, level, search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text" placeholder="Pesquisar treinamentos…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={type} onChange={e => { setType(e.target.value as any); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os formatos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={level} onChange={e => { setLevel(e.target.value as any); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os níveis</option>
          {Object.entries(LEVEL_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400">{data?.total ?? 0} treinamentos</span>
      </div>

      {loading ? <Skeleton /> : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {data?.data.map(t => (
              <TrainingCard key={t.id} training={t} onClick={() => onSelect(t.id)} />
            ))}
            {data?.data.length === 0 && (
              <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                Sem treinamentos disponíveis
              </div>
            )}
          </div>
          {(data?.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Anterior
              </button>
              <button disabled={(data?.total ?? 0) <= page * 12} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Próximos →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── View: Detail ─────────────────────────────────────────────────────────────

function DetailView({ trainingId, onBack }: { trainingId: number; onBack: () => void }) {
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading]   = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    apiFetch<Training>(`/trainings/${trainingId}`)
      .then(setTraining)
      .finally(() => setLoading(false));
  }, [trainingId]);

  const handleEnroll = async (sessionId: number) => {
    setEnrolling(sessionId);
    try {
      await apiFetch(`/trainings/sessions/${sessionId}/self-register`, { method: 'POST', body: '{}' });
      alert('Inscrição realizada!');
      const t = await apiFetch<Training>(`/trainings/${trainingId}`);
      setTraining(t);
    } catch (e: any) { alert(e.message); }
    finally { setEnrolling(null); }
  };

  const handleRate = async () => {
    if (!rating) return;
    setSubmittingRating(true);
    try {
      await apiFetch('/trainings/rate', {
        method: 'POST',
        body: JSON.stringify({ trainingId, rating, comment: comment || undefined }),
      });
      alert('Avaliação enviada!');
      setRating(0); setComment('');
    } catch (e: any) { alert(e.message); }
    finally { setSubmittingRating(false); }
  };

  if (loading || !training) return <Skeleton rows={6} />;

  const typeCfg  = TYPE_CFG[training.type];
  const levelCfg = LEVEL_CFG[training.level];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar ao catálogo
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="h-40 bg-gradient-to-br from-blue-700 to-blue-900 relative overflow-hidden">
          {training.thumbnailUrl && (
            <img src={training.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-40 absolute inset-0" />
          )}
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}>{typeCfg.icon} {typeCfg.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${levelCfg.cls}`}>{levelCfg.label}</span>
              {training.mandatory && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">Obrigatório</span>}
              {training.issueCertificate && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded">🏆 Certificado</span>}
            </div>
          </div>
        </div>

        <div className="p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{training.title}</h1>
          {training.shortDescription && <p className="text-sm text-gray-600 mb-3">{training.shortDescription}</p>}

          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
            <span>⏱ {fmtHours(training.workloadHours)}</span>
            <span>🌍 {training.language.toUpperCase()}</span>
            <span>👥 {training._count.participants} inscritos</span>
            <StarRating value={training.avgRating ?? null} />
          </div>

          {training.instructor && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar name={training.instructor.fullName} avatarUrl={training.instructor.avatarUrl} size="md" />
              <div>
                <div className="text-sm font-medium text-gray-900">{training.instructor.fullName}</div>
                <div className="text-xs text-gray-400">{training.instructor.position?.name ?? 'Instrutor'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sessões */}
      {training.sessions && training.sessions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Sessões disponíveis ({training.sessions.length})
          </div>
          {training.sessions.map(session => {
            const vacancies = session.maxParticipants > 0
              ? session.maxParticipants - (session._count.participants ?? 0)
              : null;
            const isFull = vacancies !== null && vacancies <= 0;
            return (
              <div key={session.id} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{fmtDate(session.sessionDate)}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{TYPE_CFG[session.modality as TrainingType]?.icon} {TYPE_CFG[session.modality as TrainingType]?.label}</span>
                    <span>⏱ {session.durationMinutes}min</span>
                    {session.location && <span>📍 {session.location}</span>}
                    {session.meetingUrl && (
                      <a href={session.meetingUrl} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                        🔗 Link
                      </a>
                    )}
                  </div>
                  {vacancies !== null && (
                    <div className="mt-1 text-xs">
                      {isFull
                        ? <span className="text-red-600">Vagas esgotadas {session.waitlistEnabled && '(lista de espera disponível)'}</span>
                        : <span className="text-emerald-600">{vacancies} vagas disponíveis</span>}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleEnroll(session.id)}
                  disabled={enrolling === session.id}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isFull && !session.waitlistEnabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isFull
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  } disabled:opacity-50`}
                >
                  {enrolling === session.id ? '…' :
                   isFull && session.waitlistEnabled ? 'Lista de espera' :
                   isFull ? 'Esgotado' : 'Inscrever-me'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Avaliar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">⭐ Avaliar este treinamento</div>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)}
              className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}>
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comment} onChange={e => setComment(e.target.value)}
          rows={2} placeholder="Comentário (opcional)…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <button
          onClick={handleRate}
          disabled={!rating || submittingRating}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
          {submittingRating ? 'A enviar…' : 'Enviar avaliação'}
        </button>
      </div>

      {/* Avaliações dos outros */}
      {training.ratings && training.ratings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3">Avaliações ({training._count.ratings})</div>
          <div className="space-y-3">
            {training.ratings.map(r => (
              <div key={r.id} className="flex gap-3">
                <Avatar name={r.user.fullName} avatarUrl={r.user.avatarUrl} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-800">{r.user.fullName}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`text-xs ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-600">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: My Trainings ───────────────────────────────────────────────────────

function MyTrainingsView({ onSelect }: { onSelect: (id: number) => void }) {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ParticipantStatus | ''>('');

  useEffect(() => {
    apiFetch<any[]>('/trainings/my')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? data.filter(d => d.status === filter) : data;

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['', 'REGISTERED', 'ATTENDED', 'COMPLETED', 'WAITLIST'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'Todos' : PARTICIPANT_CFG[s].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((entry: any) => {
          const training = entry.session?.training;
          if (!training) return null;
          const statusCfg = PARTICIPANT_CFG[entry.status as ParticipantStatus];
          return (
            <div
              key={entry.id}
              onClick={() => onSelect(training.id)}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0">
                {training.thumbnailUrl ? (
                  <img src={training.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {TYPE_CFG[training.type as TrainingType]?.icon ?? '📚'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{training.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{TYPE_CFG[training.type as TrainingType]?.label}</span>
                  <span>⏱ {fmtHours(training.workloadHours)}</span>
                  <span>📅 {fmtDate(entry.session?.sessionDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {entry.finalScore !== null && (
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-blue-700">{entry.finalScore}%</div>
                    <div className="text-xs text-gray-400">nota</div>
                  </div>
                )}
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem treinamentos neste estado
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Dashboard ──────────────────────────────────────────────────────────

function DashboardView() {
  const [data, setData]     = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Dashboard>('/trainings/admin/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total treinamentos', value: data.trainings.total },
          { label: 'Publicados',         value: data.trainings.published, color: 'text-emerald-600' },
          { label: 'Obrigatórios',       value: data.trainings.mandatory, color: 'text-red-600' },
          { label: 'Taxa de conclusão',  value: `${data.completionRate}%`, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Participantes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Total inscrições</div>
          <div className="text-3xl font-bold font-mono text-gray-900">{data.participants.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Rating médio</div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold font-mono text-amber-600">{data.avgRating.toFixed(1)}</div>
            <StarRating value={data.avgRating} />
          </div>
        </div>
      </div>

      {/* Top */}
      {data.topTrainings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Mais populares
          </div>
          {data.topTrainings.map((t, idx) => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">{idx + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{t.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`${TYPE_CFG[t.type].cls} px-1.5 rounded`}>{TYPE_CFG[t.type].icon}</span>
                  <span>{t._count.participants} inscritos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV = [
  { id: 'catalog',      label: 'Catálogo' },
  { id: 'my-trainings', label: 'Os meus treinamentos' },
  { id: 'dashboard',    label: 'Dashboard (Admin)' },
] as const;

type NavId = typeof NAV[number]['id'];

const TITLES: Record<View, string> = {
  catalog:      'Treinamentos',
  detail:       'Detalhe',
  'my-trainings': 'Os meus treinamentos',
  dashboard:    'Dashboard',
};

export default function TrainingsPage() {
  const [view, setView]         = useState<View>('catalog');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack   = () => { setSelectedId(null); setView('catalog'); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão de Treinamentos</p>
        </div>
      </div>

      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id as View)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'catalog'       && <CatalogView onSelect={handleSelect} />}
      {view === 'detail' && selectedId !== null && (
        <DetailView trainingId={selectedId} onBack={handleBack} />
      )}
      {view === 'my-trainings'  && <MyTrainingsView onSelect={handleSelect} />}
      {view === 'dashboard'     && <DashboardView />}
    </div>
  );
}
