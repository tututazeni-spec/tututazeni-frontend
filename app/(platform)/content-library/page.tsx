'use client';
// src/app/(dashboard)/content-library/page.tsx

import { useState } from 'react';
import {
  BookOpen, Search, Play, Clock, Star, TrendingUp, Bookmark,
  BarChart2, Award, Zap, ChevronRight, Filter, Plus,
  Video, FileText, Headphones, Brain, Shield, Globe,
  X, Eye, CheckCircle, BookMarked, Layers, RotateCcw,
} from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';
import Image from 'next/image';
import { useDebounce } from '../../../hooks/useDebounce';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'home' | 'catalogue' | 'paths' | 'my-progress' | 'analytics';

interface Content {
  id: number; title: string; description?: string; type: string;
  url: string; thumbnailUrl?: string; author?: string;
  durationMin?: number; level?: string; category?: string;
  language?: string; mandatory?: boolean; isMicrolearning?: boolean;
  hasCertification?: boolean; viewCount?: number;
  avgRating?: number; progress?: { progress: number } | null;
  isBookmarked?: boolean; createdAt: string;
}

interface LearningPath {
  id: number; title: string; description?: string; thumbnailUrl?: string;
  hasCertification?: boolean; xpReward?: number;
  totalItems?: number; completedItems?: number; overallProgress?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────

const FORMAT_ICON: Record<string, any> = {
  VIDEO: Video, ARTICLE: FileText, PODCAST: Headphones,
  PDF: FileText, EBOOK: BookOpen, SCORM: Brain, COURSE: BookOpen,
  MICROLEARNING: Zap, QUIZ: Brain, WEBINAR: Video, HTML5: Globe,
  DEFAULT: BookOpen,
};

const FORMAT_COLOR: Record<string, string> = {
  VIDEO:        'bg-red-100 text-red-700',
  ARTICLE:      'bg-blue-100 text-blue-700',
  PODCAST:      'bg-purple-100 text-purple-700',
  PDF:          'bg-orange-100 text-orange-700',
  SCORM:        'bg-indigo-100 text-indigo-700',
  MICROLEARNING:'bg-amber-100 text-amber-700',
  COURSE:       'bg-emerald-100 text-emerald-700',
  QUIZ:         'bg-pink-100 text-pink-700',
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     'text-emerald-600',
  INTERMEDIATE: 'text-amber-600',
  ADVANCED:     'text-orange-600',
  EXPERT:       'text-red-600',
};

const CATEGORY_ICON: Record<string, any> = {
  HARD_SKILLS: Brain, SOFT_SKILLS: Star, COMPLIANCE: Shield,
  ONBOARDING: BookOpen, LANGUAGES: Globe, LEADERSHIP: TrendingUp,
};

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1' }: {
  value: number; color?: string; height?: string;
}) {
  return (
    <div className={`w-full ${height} bg-slate-200 rounded-full overflow-hidden`}>
      <div className={`${height} ${color} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Skeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-slate-100 rounded-xl h-52" />
      ))}
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────

function ContentCard({ content, onBookmark, compact = false }: {
  content: Content; onBookmark?: (id: number) => void; compact?: boolean;
}) {
  const Icon = FORMAT_ICON[content.type] ?? FORMAT_ICON.DEFAULT;
  const progress = content.progress?.progress ?? 0;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await apiClient.patch(`/content-library/${content.id}/bookmark`, {});
    onBookmark?.(content.id);
  };

  const handleView = async () => {
    await apiClient.patch(`/content-library/${content.id}/view`, {}).catch(() => {});
    window.open(content.url, '_blank');
  };

  if (compact) return (
    <div onClick={handleView}
      className="bg-white rounded-lg border border-slate-100 p-3 flex items-center gap-3
        hover:shadow-sm transition-all cursor-pointer">
      <div className={`p-2 rounded-lg shrink-0 ${FORMAT_COLOR[content.type] ?? 'bg-slate-100 text-slate-600'}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{content.title}</p>
        <p className="text-[10px] text-slate-400">
          {content.durationMin ? `${content.durationMin} min` : ''} {content.level ? `· ${content.level}` : ''}
        </p>
        {progress > 0 && <ProgressBar value={progress} height="h-0.5" />}
      </div>
      {progress === 100 && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden
      hover:shadow-lg transition-all cursor-pointer group">
      {/* Thumbnail */}
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 h-36 flex items-center justify-center"
        onClick={handleView}>
        {content.thumbnailUrl
          ? <Image src={content.thumbnailUrl} alt={content.title} fill className="object-cover" />
          : <Icon size={32} className="text-slate-400" />
        }
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity
          flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play size={18} className="text-slate-800 ml-0.5" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {content.mandatory && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
              OBRIG.
            </span>
          )}
          {content.hasCertification && (
            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
              CERT.
            </span>
          )}
          {content.isMicrolearning && (
            <span className="bg-violet-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
              MICRO
            </span>
          )}
        </div>
        <button onClick={handleBookmark}
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors">
          <Bookmark size={13}
            className={content.isBookmarked ? 'text-indigo-600 fill-indigo-600' : 'text-slate-500'} />
        </button>
        {/* Progress bar on thumbnail bottom */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <ProgressBar value={progress} color={progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} height="h-1" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FORMAT_COLOR[content.type] ?? 'bg-slate-100 text-slate-600'}`}>
            {content.type}
          </span>
          {content.level && (
            <span className={`text-[10px] font-medium ${LEVEL_COLOR[content.level] ?? 'text-slate-500'}`}>
              {content.level}
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-1">
          {content.title}
        </h4>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {content.durationMin && (
            <span className="flex items-center gap-0.5"><Clock size={10} />{content.durationMin} min</span>
          )}
          {content.avgRating && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Star size={10} className="fill-amber-400" />{content.avgRating}
            </span>
          )}
          {content.viewCount !== undefined && (
            <span className="flex items-center gap-0.5"><Eye size={10} />{content.viewCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Content Row ─────────────────────────────────────────────────

function ContentRow({ title, items, loading, icon: Icon = BookOpen }: {
  title: string; items: Content[]; loading?: boolean; icon?: any;
}) {
  if (loading) return (
    <div>
      <div className="h-4 bg-slate-200 w-40 rounded animate-pulse mb-3" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 animate-pulse">
        {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-48" />)}
      </div>
    </div>
  );

  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-indigo-600" />
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400 ml-1">{items.length}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {items.map(c => <ContentCard key={c.id} content={c} />)}
      </div>
    </div>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────

function HomeTab() {
  const [search, setSearch]           = useState('');

  const recQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.recommended(), '/content-library/recommended',
    { params: { limit: 8 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trendingQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.trending(), '/content-library/trending',
    { params: { limit: 8 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const newQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.new(), '/content-library/new',
    { params: { limit: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const continueQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.continueWatching(), '/content-library/continue-watching',
    { params: { limit: 5 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const mandatoryQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.mandatory(), '/content-library/mandatory',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const recommended = recQuery.data ?? [];
  const trending    = trendingQuery.data ?? [];
  const newContent  = newQuery.data ?? [];
  const continueW   = continueQuery.data ?? [];
  const mandatory   = mandatoryQuery.data ?? [];
  const loading = recQuery.isLoading || trendingQuery.isLoading || newQuery.isLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Trigger catalogue tab with search
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero search */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-1">O que queres aprender hoje?</h2>
        <p className="text-indigo-200 text-sm mb-4">Acede a cursos, vídeos, artigos e muito mais</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, skills, tags..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
          </div>
          <button type="submit"
            className="px-5 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
            Pesquisar
          </button>
        </form>
      </div>

      {/* Continue watching */}
      {continueW.length > 0 && (
        <ContentRow title="Continuar a ver" items={continueW} icon={RotateCcw} />
      )}

      {/* Mandatory */}
      {mandatory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-red-500" />
            <h3 className="font-semibold text-slate-700">Conteúdos Obrigatórios</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {mandatory.filter((c: any) => !c.completed).length} pendentes
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {mandatory.slice(0, 4).map((c: any) => (
              <ContentCard key={c.id} content={c} compact />
            ))}
          </div>
        </div>
      )}

      {loading ? <Skeleton count={8} /> : (
        <>
          <ContentRow title="Recomendado para ti"   items={recommended} icon={Star} />
          <ContentRow title="Em Trending esta semana" items={trending}  icon={TrendingUp} />
          <ContentRow title="Adicionados recentemente" items={newContent} icon={Zap} />
        </>
      )}
    </div>
  );
}

// ─── Catalogue Tab ────────────────────────────────────────────────

function CatalogueTab() {
  const [search, setSearch]   = useState('');
  const [format, setFormat]   = useState('');
  const [level, setLevel]     = useState('');
  const [sortBy, setSortBy]   = useState('newest');
  const [micro, setMicro]     = useState(false);
  const [cert, setCert]       = useState(false);
  const [page, setPage]       = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page, limit: 20, sortBy,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(format ? { format } : {}),
    ...(level  ? { level  } : {}),
    ...(micro  ? { isMicrolearning: 'true' } : {}),
    ...(cert   ? { hasCertification: 'true' } : {}),
  };
  const { data, isLoading } = useApiQuery<{ data: Content[]; meta: any }>(
    queryKeys.contentLibrary.catalogue(params), '/content-library',
    { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
  );
  const loading = isLoading;

  const FORMATS = ['VIDEO', 'ARTICLE', 'PODCAST', 'PDF', 'SCORM', 'COURSE', 'MICROLEARNING', 'QUIZ'];
  const LEVELS  = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pesquisar conteúdos..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:border-indigo-400" />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Format */}
          <select value={format} onChange={e => { setFormat(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="">Todos os formatos</option>
            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Level */}
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="">Todos os níveis</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="newest">Mais recente</option>
            <option value="popular">Mais visto</option>
            <option value="rating">Melhor avaliado</option>
            <option value="duration">Mais curto</option>
          </select>

          {/* Toggles */}
          {[
            { label: '⚡ Micro', value: micro, set: setMicro },
            { label: '🎓 Certif.', value: cert, set: setCert },
          ].map(t => (
            <button key={t.label} onClick={() => t.set(!t.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                t.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}>
              {t.label}
            </button>
          ))}

          <span className="text-xs text-slate-400 ml-auto">{data?.meta.total ?? 0} conteúdos</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? <Skeleton count={12} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map(c => <ContentCard key={c.id} content={c} />)}
          {(data?.data.length ?? 0) === 0 && (
            <div className="col-span-4 py-16 text-center text-slate-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum conteúdo encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40">
            ← Anterior
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">
            {page} / {data.meta.totalPages}
          </span>
          <button disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40">
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Learning Paths Tab ───────────────────────────────────────────

function PathsTab() {
  const { data: resp, isLoading } = useApiQuery<{ data: LearningPath[] }>(
    queryKeys.contentLibrary.paths(), '/content-library/paths/all',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = resp?.data ?? [];

  if (isLoading) return <Skeleton count={3} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {data.map(path => (
        <div key={path.id}
          className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
          <div className="h-28 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center relative">
            {path.thumbnailUrl
              ? <Image src={path.thumbnailUrl} alt={path.title} fill className="object-cover" />
              : <Layers size={36} className="text-white opacity-60" />
            }
            {path.hasCertification && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-white
                text-[10px] px-2 py-0.5 rounded-full font-bold">
                <Award size={10} /> CERTIF.
              </div>
            )}
          </div>
          <div className="p-4">
            <h4 className="font-semibold text-slate-800 mb-1">{path.title}</h4>
            {path.description && (
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{path.description}</p>
            )}

            {path.overallProgress !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Progresso</span>
                  <span className="font-semibold text-indigo-600">{path.overallProgress}%</span>
                </div>
                <ProgressBar value={path.overallProgress}
                  color={path.overallProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} height="h-1.5" />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{path.totalItems ?? 0} conteúdos</span>
              {path.xpReward && (
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Zap size={11} />{path.xpReward} XP
                </span>
              )}
            </div>

            <button
              onClick={() => apiClient.post(`/content-library/paths/${path.id}/enroll`, {})}
              className="mt-3 w-full py-2 bg-indigo-600 text-white text-sm rounded-lg
                hover:bg-indigo-700 transition-colors font-medium">
              {(path.overallProgress ?? 0) > 0 ? 'Continuar' : 'Iniciar Trilha'}
            </button>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="col-span-3 py-16 text-center text-slate-400">
          <Layers size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma learning path disponível</p>
        </div>
      )}
    </div>
  );
}

// ─── My Progress Tab ─────────────────────────────────────────────

function MyProgressTab() {
  const progressQuery = useApiQuery<any>(
    queryKeys.contentLibrary.myProgress(), '/content-library/my/progress',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const statsQuery = useApiQuery<any>(
    queryKeys.contentLibrary.myStats(), '/content-library/analytics/my-stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const bookmarksQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.bookmarks(), '/content-library/bookmarks',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const progress  = progressQuery.data ?? null;
  const stats     = statsQuery.data ?? null;
  const bookmarks = bookmarksQuery.data ?? [];

  if (progressQuery.isLoading || statsQuery.isLoading || bookmarksQuery.isLoading)
    return <Skeleton count={4} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Visualizações',  value: stats.viewCount,    icon: Eye,          color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Concluídos',     value: stats.completions,  icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Guardados',      value: stats.bookmarkCount,icon: BookMarked,   color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Horas de aprendizagem', value: `${stats.totalHours}h`, icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className={`p-2 rounded-lg ${s.bg} w-fit mb-2`}><s.icon size={16} className={s.color} /></div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* In progress */}
      {(progress?.data.filter((p: any) => p.progress > 0 && p.progress < 100).length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <RotateCcw size={16} className="text-indigo-500" />
            Em Progresso
          </h3>
          <div className="space-y-2">
            {progress.data
              .filter((p: any) => p.progress > 0 && p.progress < 100)
              .slice(0, 5)
              .map((p: any) => (
                <div key={p.contentId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.content?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <ProgressBar value={p.progress} height="h-1" />
                      <span className="text-[10px] text-slate-400 shrink-0">{p.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {(progress?.stats.completed ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Concluídos ({progress.stats.completed})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {progress.data
              .filter((p: any) => p.progress === 100)
              .slice(0, 8)
              .map((p: any) => (
                <ContentCard key={p.contentId} content={{ ...p.content, progress: p }} compact />
              ))}
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Bookmark size={16} className="text-amber-500" />
            Guardados ({bookmarks.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {bookmarks.map(c => <ContentCard key={c.id} content={{ ...c, isBookmarked: true }} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────

function AnalyticsTab() {
  const { data, isLoading } = useApiQuery<any>(
    queryKeys.contentLibrary.analytics(), '/content-library/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton count={4} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Conteúdos', value: data?.kpis.totalContent,    icon: BookOpen,    color: 'text-indigo-600' },
          { label: 'Activos',            value: data?.kpis.activeContent,   icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Visualizações',      value: data?.kpis.totalViews,      icon: Eye,         color: 'text-blue-600' },
          { label: 'Conclusões',         value: data?.kpis.totalCompletions,icon: Award,       color: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icon size={16} className={k.color} />
              <p className="text-xs text-slate-500">{k.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{k.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Distribuição por Formato</h3>
          <div className="space-y-2">
            {(data?.formatBreakdown ?? []).map((f: any) => {
              const total = (data?.formatBreakdown ?? []).reduce((s: number, x: any) => s + x.count, 0);
              const pct   = total > 0 ? Math.round((f.count / total) * 100) : 0;
              return (
                <div key={f.format} className="flex items-center gap-3">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded w-24 text-center font-medium
                    ${FORMAT_COLOR[f.format] ?? 'bg-slate-100 text-slate-600'}`}>
                    {f.format}
                  </span>
                  <div className="flex-1">
                    <ProgressBar value={pct} height="h-2" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-8 text-right">{f.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most viewed */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Mais Vistos (30 dias)</h3>
          <div className="space-y-3">
            {(data?.mostViewed ?? []).map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{v.content?.title}</p>
                  <p className="text-[10px] text-slate-400">{v.content?.type}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0">
                  {v.weeklyViews} views
                </span>
              </div>
            ))}
            {(data?.mostViewed ?? []).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Sem dados ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Recently added */}
      {(data?.recentlyAdded.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Adicionados Recentemente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data!.recentlyAdded.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium w-20 text-center
                  ${FORMAT_COLOR[c.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {c.type}
                </span>
                <p className="text-sm font-medium text-slate-700 flex-1 truncate">{c.title}</p>
                <p className="text-[10px] text-slate-400 shrink-0">
                  {new Date(c.createdAt).toLocaleDateString('pt')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'home',        label: 'Início',      icon: BookOpen },
  { id: 'catalogue',   label: 'Catálogo',    icon: Search },
  { id: 'paths',       label: 'Trilhas',     icon: Layers },
  { id: 'my-progress', label: 'O Meu Percurso', icon: TrendingUp },
  { id: 'analytics',   label: 'Analytics',  icon: BarChart2 },
];

export default function ContentLibraryPage() {
  const [tab, setTab] = useState<Tab>('home');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    'home':        <HomeTab />,
    'catalogue':   <CatalogueTab />,
    'paths':       <PathsTab />,
    'my-progress': <MyProgressTab />,
    'analytics':   <AnalyticsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <BookOpen size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Content Library</h1>
            </div>
            <p className="text-sm text-slate-400">
              Cursos · Vídeos · Artigos · Podcasts · Learning Paths
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
              text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={14} />
              Adicionar Conteúdo
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {TAB_COMPONENTS[tab]}
      </div>
    </div>
  );
}