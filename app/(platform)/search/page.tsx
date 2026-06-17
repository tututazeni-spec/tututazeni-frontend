'use client';
// src/app/(dashboard)/search/page.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Users, BookOpen, FileText, Target, Brain,
  TrendingUp, Clock, X, ChevronRight, Zap, Award,
  Filter, BarChart2,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// ─── Types ───────────────────────────────────────────────────────

interface SearchResult {
  type: string; id: number | string; title: string;
  subtitle: string; url?: string; avatarUrl?: string;
  thumbnailUrl?: string; mandatory?: boolean;
}

interface SearchResponse {
  query: string;
  grouped: Record<string, SearchResult[]>;
  counts: Record<string, number>;
}

// ─── Icons & Config ───────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; path: string }> = {
  user:       { label: 'Colaboradores', icon: Users,     color: 'text-indigo-600', bg: 'bg-indigo-50',  path: 'users' },
  course:     { label: 'Cursos',        icon: BookOpen,  color: 'text-teal-600',   bg: 'bg-teal-50',    path: 'courses' },
  content:    { label: 'Conteúdos',     icon: Zap,       color: 'text-blue-600',   bg: 'bg-blue-50',    path: 'content' },
  document:   { label: 'Documentos',    icon: FileText,  color: 'text-violet-600', bg: 'bg-violet-50',  path: 'documents' },
  pdi:        { label: 'PDIs',          icon: Target,    color: 'text-amber-600',  bg: 'bg-amber-50',   path: 'pdi' },
  competency: { label: 'Competências',  icon: Brain,     color: 'text-emerald-600',bg: 'bg-emerald-50', path: 'competencies' },
  scenario:   { label: 'Simulações',    icon: Award,     color: 'text-pink-600',   bg: 'bg-pink-50',    path: 'scenarios' },
};

// ─── Result Card ──────────────────────────────────────────────────

function ResultCard({ result }: { result: SearchResult }) {
  const conf = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.content;
  const Icon = conf.icon;

  return (
    <a href={result.url ?? '#'}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      {result.avatarUrl || result.thumbnailUrl ? (
        <img src={result.avatarUrl ?? result.thumbnailUrl}
          alt={result.title}
          className="w-9 h-9 rounded-lg object-cover shrink-0" />
      ) : (
        <div className={`w-9 h-9 rounded-lg ${conf.bg} flex items-center justify-center shrink-0`}>
          <Icon size={16} className={conf.color} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{result.title}</p>
        <p className="text-[10px] text-slate-400 truncate">{result.subtitle}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {result.mandatory && (
          <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">OBRIG.</span>
        )}
        <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </a>
  );
}

// ─── Suggestions Panel ────────────────────────────────────────────

function SuggestionsPanel({ onSearch }: { onSearch: (q: string) => void }) {
  const { data } = useApiQuery<any>(
    queryKeys.search.suggestions(), '/search/suggestions',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  const { data: historyResp } = useApiQuery<any>(
    queryKeys.search.history(), '/search/history',
    { params: { limit: 8 }, staleTime: STALE_TIME.DYNAMIC, retry: false },
  );
  const history = historyResp?.history ?? [];

  return (
    <div className="space-y-6">
      {/* Recent searches */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={12} />Pesquisas Recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 8).map((h: any, i: number) => (
              <button key={i} onClick={() => onSearch(h.query)}
                className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                {h.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {(data?.trendingSearches ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <TrendingUp size={12} />Em Alta
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data.trendingSearches as string[]).slice(0, 6).map((t, i) => (
              <button key={i} onClick={() => onSearch(t)}
                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended courses */}
      {(data?.recommendedCourses ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cursos Recomendados</h3>
          <div className="space-y-1">
            {(data.recommendedCourses as SearchResult[]).map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Popular content */}
      {(data?.popularContent ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Conteúdo Popular</h3>
          <div className="space-y-1">
            {(data.popularContent as SearchResult[]).slice(0, 4).map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────

function ResultsView({ data, activeType, setActiveType }: {
  data: SearchResponse;
  activeType: string;
  setActiveType: (t: string) => void;
}) {
  const types = Object.keys(data.grouped).filter(t => (data.grouped[t]?.length ?? 0) > 0);

  const displayResults = activeType === 'all'
    ? Object.values(data.grouped).flat()
    : (data.grouped[activeType] ?? []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {/* Type sidebar */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <button onClick={() => setActiveType('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 ${activeType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span>Todos</span>
            <span className="text-[10px]">{Object.values(data.counts).reduce((a, b) => a + b, 0)}</span>
          </button>
          {types.map(t => {
            const conf = TYPE_CONFIG[t];
            if (!conf) return null;
            const Icon = conf.icon;
            return (
              <button key={t} onClick={() => setActiveType(t)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 ${activeType === t ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="flex items-center gap-2">
                  <Icon size={13} className={activeType === t ? 'text-white' : conf.color} />
                  {conf.label}
                </span>
                <span className="text-[10px]">{data.counts[t] ?? data.grouped[t]?.length ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="md:col-span-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-500">
            {displayResults.length} resultado(s) para <strong>&quot;{data.query}&quot;</strong>
          </p>
        </div>

        {displayResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 py-16 text-center text-slate-400">
            <Search size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem resultados para &quot;{data.query}&quot;</p>
            <p className="text-xs mt-1">Tenta um termo diferente</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
            {displayResults.map((r, i) => <ResultCard key={i} result={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autocomplete
  useEffect(() => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      apiClient.get<any>('/search/autocomplete', { params: { q: query, limit: 6 } })
        .then(d => setSuggestions(d.suggestions ?? [])).catch(() => {});
    }, 200);
  }, [query]);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setSuggestions([]);
    setLoading(true);
    apiClient.get<SearchResponse>('/search', { params: { q, limit: 10 } })
      .then(d => { setResults(d); setActiveType('all'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search header */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg"><Search size={18} className="text-indigo-600" /></div>
            <h1 className="text-xl font-bold text-slate-800">Pesquisa Universal</h1>
          </div>
          <p className="text-sm text-slate-400 mb-5">Pesquisa colaboradores, cursos, conteúdos, PDIs e mais</p>

          {/* Search bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
              placeholder="Pesquisar em toda a plataforma..."
              className="w-full pl-12 pr-12 py-4 text-sm border border-slate-200 rounded-2xl shadow-sm
                focus:outline-none focus:border-indigo-400 focus:shadow-md transition-all" />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null); setSuggestions([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}

            {/* Autocomplete dropdown */}
            {suggestions.length > 0 && !results && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20">
                {suggestions.map((s: any, i: number) => (
                  <button key={i} onClick={() => { setQuery(s.text); doSearch(s.text); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
                    <Clock size={12} className="text-slate-300 shrink-0" />
                    <span className="text-sm text-slate-700">{s.text}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{s.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick type filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(TYPE_CONFIG).map(([key, conf]) => {
              const Icon = conf.icon;
              return (
                <button key={key} onClick={() => { if (query) { setLoading(true); apiClient.get<any>(`/search/${conf.path}`, { params: { q: query, limit: 20 } }).then(d => { setResults({ query, grouped: { [key]: d.results }, counts: { [key]: d.count } }); setActiveType(key); }).finally(() => setLoading(false)); } }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${conf.bg} ${conf.color} border-transparent hover:border-current`}>
                  <Icon size={12} />{conf.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !results && (
          <SuggestionsPanel onSearch={(q) => { setQuery(q); doSearch(q); }} />
        )}

        {!loading && results && (
          <ResultsView data={results} activeType={activeType} setActiveType={setActiveType} />
        )}
      </div>
    </div>
  );
}






















