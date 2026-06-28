// src/app/(dashboard)/micro-learning/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { sanitizeHtml } from '@/lib/sanitize';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType  = 'VIDEO' | 'TEXT' | 'AUDIO' | 'INFOGRAPHIC' | 'QUIZ';
type ContentLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface MicroLearning {
  id: number;
  title: string;
  description: string | null;
  contentType: ContentType;
  level: ContentLevel;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  textContent: string | null;
  tags: string[];
  takeaways: string[];
  xpReward: number;
  viewCount: number;
  author: { id: number; fullName: string; avatarUrl: string | null } | null;
  category: { id: number; name: string } | null;
  userProgress?: { progress: number; watchedSeconds: number; completedAt: string | null } | null;
  userLiked?: boolean;
  userSaved?: boolean;
  isCompleted?: boolean;
  _count: { likes: number; comments: number };
}

interface MyDashboard {
  streak: { current: number; longest: number; lastActivity: string | null };
  stats: { completed: number; totalMinutes: number; totalXp: number; avgQuizScore: number };
  recentActivity: any[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string; // JSON
}

type View = 'feed' | 'player' | 'dashboard' | 'saved';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number | null): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Skeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<ContentType, { label: string; icon: string; cls: string }> = {
  VIDEO:       { label: 'Vídeo',       icon: '▶️',  cls: 'bg-red-50 text-red-700' },
  TEXT:        { label: 'Leitura',     icon: '📄',  cls: 'bg-blue-50 text-blue-700' },
  AUDIO:       { label: 'Áudio',       icon: '🎧',  cls: 'bg-purple-50 text-purple-700' },
  INFOGRAPHIC: { label: 'Infográfico', icon: '📊',  cls: 'bg-amber-50 text-amber-700' },
  QUIZ:        { label: 'Quiz',        icon: '❓',  cls: 'bg-emerald-50 text-emerald-700' },
};

const LEVEL_CFG: Record<ContentLevel, { label: string; cls: string }> = {
  BEGINNER:     { label: 'Básico',      cls: 'bg-emerald-100 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio',  cls: 'bg-amber-100 text-amber-700' },
  ADVANCED:     { label: 'Avançado',    cls: 'bg-red-100 text-red-700' },
};

// ─── Micro Card ───────────────────────────────────────────────────────────────

function MicroCard({ item, onClick }: { item: MicroLearning; onClick: () => void }) {
  const typeCfg  = TYPE_CFG[item.contentType];
  const levelCfg = LEVEL_CFG[item.level];
  const pct      = item.userProgress?.progress ?? 0;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {item.thumbnailUrl ? (
          <Image src={item.thumbnailUrl} alt="" fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
            {typeCfg.icon}
          </div>
        )}
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
          {fmtDuration(item.durationSeconds)}
        </div>
        {/* Type badge */}
        <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}>
          {typeCfg.icon} {typeCfg.label}
        </div>
        {/* Completed overlay */}
        {item.isCompleted && (
          <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
            <div className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              ✓ Concluído
            </div>
          </div>
        )}
        {/* Progress bar */}
        {pct > 0 && !item.isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div className="h-full bg-blue-400" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-blue-700 transition-colors">
          {item.title}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs px-1.5 py-0.5 rounded ${levelCfg.cls}`}>{levelCfg.label}</span>
            {item.tags.slice(0, 1).map(t => (
              <span key={t} className="text-xs text-gray-400">#{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>❤ {item._count.likes}</span>
            <span className="text-amber-500 font-medium">+{item.xpReward}xp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: Feed ───────────────────────────────────────────────────────────────

function FeedView({ onSelect }: { onSelect: (item: MicroLearning) => void }) {
  const [type, setType]       = useState<ContentType | ''>('');
  const [level, setLevel]     = useState<ContentLevel | ''>('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 12, contentType: type, level, search: debouncedSearch };

  const { data, isLoading: loading } = useApiQuery<{ data: MicroLearning[]; total: number }>(
    queryKeys.microLearning.feed(params), '/micro-learning/feed/me',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          type="text" placeholder="Pesquisar…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[180px] max-w-xs"
        />
        {/* Tipo */}
        <div className="flex gap-1">
          {(['', 'VIDEO', 'TEXT', 'AUDIO', 'QUIZ'] as const).map(t => (
            <button key={t} onClick={() => { setType(t as any); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                type === t ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === '' ? 'Todos' : TYPE_CFG[t as ContentType].icon + ' ' + TYPE_CFG[t as ContentType].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Skeleton rows={4} /> : (
        <>
          <div className="text-xs text-gray-400 mb-4">{data?.total ?? 0} conteúdos</div>
          <div className="grid grid-cols-3 gap-4">
            {data?.data.map(item => (
              <MicroCard key={item.id} item={item} onClick={() => onSelect(item)} />
            ))}
            {data?.data.length === 0 && (
              <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                Sem conteúdos disponíveis
              </div>
            )}
          </div>
          {(data?.total ?? 0) > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">
                ← Anterior
              </button>
              <button disabled={(data?.total ?? 0) <= page * 12} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">
                Próximos →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── View: Player ─────────────────────────────────────────────────────────────

function PlayerView({ item, onBack, onNext }: {
  item: MicroLearning;
  onBack: () => void;
  onNext?: () => void;
}) {
  const [progress, setProgress]       = useState(item.userProgress?.progress ?? 0);
  const [quizAnswers, setQuizAnswers]  = useState<number[]>([]);
  const [quizResult, setQuizResult]   = useState<any>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [liked, setLiked]             = useState(item.userLiked ?? false);
  const [saved, setSaved]             = useState(item.userSaved ?? false);
  const [completed, setCompleted]     = useState(item.isCompleted ?? false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  // Auto-progress para conteúdo de texto/áudio
  useEffect(() => {
    if (item.contentType === 'TEXT' || item.contentType === 'AUDIO') {
      if (progress >= 100) return;
      const duration = item.durationSeconds ?? 60;
      const step     = (100 / duration) * 2; // actualiza a cada 2s

      intervalRef.current = setInterval(async () => {
        const newPct = Math.min(100, progressRef.current + step);
        setProgress(newPct);
        if (newPct >= 100 && !completed) {
          clearInterval(intervalRef.current!);
          await saveProgress(100);
          setCompleted(true);
        }
      }, 2000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [item.id]);

  const saveProgress = async (pct: number) => {
    try {
      await apiClient.post('/micro-learning/progress', {
        microLearningId: item.id, progress: Math.round(pct),
      });
    } catch { /* ignorar */ }
  };

  const handleInteract = async (action: 'LIKE' | 'SAVE') => {
    try {
      const res = await apiClient.post<any>('/micro-learning/interact', {
        microLearningId: item.id, action,
      });
      if (action === 'LIKE') setLiked(res.active);
      if (action === 'SAVE') setSaved(res.active);
    } catch { /* ignorar */ }
  };

  const handleMarkComplete = async () => {
    await saveProgress(100);
    setProgress(100);
    setCompleted(true);
  };

  const handleQuizSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await apiClient.post<any>('/micro-learning/quiz/submit', {
        microLearningId: item.id, answers: quizAnswers,
      });
      setQuizResult(result);
      if (result.score >= 60) {
        await saveProgress(100);
        setCompleted(true);
      }
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const typeCfg  = TYPE_CFG[item.contentType];
  const levelCfg = LEVEL_CFG[item.level];

  let quizQs: any[] = [];
  try { quizQs = (item as any).quizQuestions?.map((q: any) => ({ ...q, options: JSON.parse(q.options) })) ?? []; }
  catch { quizQs = []; }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar ao feed
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-5">
        {/* Thumbnail / Media */}
        <div className="relative aspect-video bg-gray-900">
          {item.thumbnailUrl && (
            <Image src={item.thumbnailUrl} alt="" fill className="object-cover opacity-60" />
          )}
          {(item.contentType === 'VIDEO' || item.contentType === 'AUDIO') && item.mediaUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {item.contentType === 'VIDEO' ? (
                <video src={item.mediaUrl} controls className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎧</div>
                  <audio src={item.mediaUrl} controls className="w-full max-w-sm" />
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
              {typeCfg.icon}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}>{typeCfg.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${levelCfg.cls}`}>{levelCfg.label}</span>
                <span className="text-xs text-gray-400">⏱ {fmtDuration(item.durationSeconds)}</span>
                <span className="text-amber-500 text-xs font-medium">+{item.xpReward} XP</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">{item.title}</h1>
              {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
            </div>

            {/* Acções */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleInteract('LIKE')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
                  liked ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'
                }`}
              >
                ❤
              </button>
              <button
                onClick={() => handleInteract('SAVE')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
                  saved ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-400'
                }`}
              >
                🔖
              </button>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(t => (
              <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">#{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo de texto */}
      {item.contentType === 'TEXT' && item.textContent && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.textContent) }} />
        </div>
      )}

      {/* Takeaways */}
      {item.takeaways.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
          <div className="text-sm font-semibold text-blue-800 mb-3">💡 Pontos-chave</div>
          <ul className="space-y-2">
            {item.takeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quiz */}
      {item.contentType === 'QUIZ' && quizQs.length > 0 && !quizResult && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">❓ Quiz — {quizQs.length} perguntas</div>
          {quizQs.map((q: any, idx: number) => (
            <div key={q.id} className="mb-5 pb-5 border-b border-gray-100 last:border-0">
              <div className="text-sm font-medium text-gray-800 mb-3">{idx + 1}. {q.question}</div>
              <div className="space-y-2">
                {q.options.map((opt: any, oi: number) => (
                  <label key={oi}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      quizAnswers[idx] === oi ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={quizAnswers[idx] === oi}
                      onChange={() => {
                        const a = [...quizAnswers];
                        a[idx] = oi;
                        setQuizAnswers(a);
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={handleQuizSubmit}
            disabled={quizAnswers.length < quizQs.length || submitting}
            className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? 'A corrigir…' : 'Submeter respostas'}
          </button>
        </div>
      )}

      {/* Resultado quiz */}
      {quizResult && (
        <div className={`border rounded-2xl p-5 mb-5 ${quizResult.score >= 60 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-center mb-4 ${quizResult.score >= 60 ? 'text-emerald-700' : 'text-red-700'}`}>
            <div className="text-4xl font-bold font-mono">{quizResult.score}%</div>
            <div className="text-sm font-medium mt-1">
              {quizResult.score >= 60 ? '🎉 Aprovado!' : '😔 Tenta novamente'}
            </div>
            <div className="text-xs mt-0.5">{quizResult.correct}/{quizResult.total} correctas</div>
          </div>
        </div>
      )}

      {/* Botão concluir (para não-quiz) */}
      {item.contentType !== 'QUIZ' && !completed && (
        <button
          onClick={handleMarkComplete}
          className="w-full py-3 bg-emerald-600 text-white text-sm font-semibold rounded-2xl hover:bg-emerald-700 mb-5"
        >
          ✅ Marcar como concluído
        </button>
      )}

      {completed && (
        <div className="py-3 text-center text-emerald-700 font-semibold text-sm bg-emerald-50 rounded-2xl border border-emerald-200 mb-5">
          ✓ Concluído · +{item.xpReward} XP ganho!
        </div>
      )}
    </div>
  );
}

// ─── View: Dashboard ──────────────────────────────────────────────────────────

function DashboardView() {
  const { data, isLoading } = useApiQuery<MyDashboard>(
    queryKeys.microLearning.dashboard(), '/micro-learning/dashboard/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { streak, stats } = data;

  return (
    <div className="space-y-6">
      {/* Streak */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-amber-100 mb-1">Streak actual</div>
          <div className="text-5xl font-bold">{streak.current}</div>
          <div className="text-sm text-amber-100 mt-1">dias consecutivos 🔥</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-amber-100">Recorde</div>
          <div className="text-3xl font-bold">{streak.longest}</div>
          <div className="text-sm text-amber-100 mt-1">dias</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Concluídos',  value: stats.completed,        color: 'text-emerald-600' },
          { label: 'Minutos',     value: stats.totalMinutes,     color: 'text-blue-600' },
          { label: 'XP ganho',    value: stats.totalXp,          color: 'text-amber-600' },
          { label: 'Quiz médio',  value: `${stats.avgQuizScore}%` },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actividade recente */}
      {data.recentActivity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Actividade recente
          </div>
          {data.recentActivity.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_CFG[a.microLearning?.contentType as ContentType]?.cls ?? 'bg-gray-100'}`}>
                {TYPE_CFG[a.microLearning?.contentType as ContentType]?.icon ?? '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{a.microLearning?.title}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono font-bold text-blue-600">{a.progress}%</div>
                {a.completedAt && <div className="text-xs text-emerald-600">✓ Concluído</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Saved ──────────────────────────────────────────────────────────────

function SavedView({ onSelect }: { onSelect: (item: MicroLearning) => void }) {
  const { data = [], isLoading: loading } = useApiQuery<MicroLearning[]>(
    queryKeys.microLearning.saved(), '/micro-learning/saved/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="text-sm text-gray-400 mb-4">{data.length} guardados</div>
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
          🔖 Nenhum conteúdo guardado ainda
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data.map(item => (
            <MicroCard key={item.id} item={item} onClick={() => onSelect(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'feed',      label: '⚡ Feed' },
  { id: 'saved',     label: '🔖 Guardados' },
  { id: 'dashboard', label: '📊 O meu progresso' },
];

const TITLES: Record<View, string> = {
  feed:      'Micro-Learning',
  player:    'A aprender',
  saved:     'Guardados',
  dashboard: 'O meu progresso',
};

export default function MicroLearningPage() {
  const [view, setView]     = useState<View>('feed');
  const [selected, setSelected] = useState<MicroLearning | null>(null);
  const [feedItems, setFeedItems] = useState<MicroLearning[]>([]);

  const handleSelect = (item: MicroLearning) => { setSelected(item); setView('player'); };
  const handleBack   = () => { setSelected(null); setView('feed'); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Aprendizagem rápida</p>
        </div>
      </div>

      {/* Tabs */}
      {view !== 'player' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'feed'      && <FeedView onSelect={handleSelect} />}
      {view === 'player' && selected && (
        <PlayerView item={selected} onBack={handleBack} />
      )}
      {view === 'saved'     && <SavedView onSelect={handleSelect} />}
      {view === 'dashboard' && <DashboardView />}
    </div>
  );
}