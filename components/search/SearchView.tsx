// components/search/SearchView.tsx

import { Search, X, Clock } from 'lucide-react';
import type { RefObject } from 'react';
import { ResultsView } from './ResultsView';
import { SuggestionsPanel } from './SuggestionsPanel';
import { TYPE_CONFIG } from './types';
import type { AutocompleteSuggestion, SearchResponse } from './types';

interface SearchViewProps {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResponse | null;
  activeType: string;
  setActiveType: (t: string) => void;
  suggestions: AutocompleteSuggestion[];
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  doSearch: (q: string) => void;
  searchByType: (key: string, path: string) => void;
  clear: () => void;
}

export function SearchView({
  query,
  setQuery,
  results,
  activeType,
  setActiveType,
  suggestions,
  inputRef,
  loading,
  doSearch,
  searchByType,
  clear,
}: SearchViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search header */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Search size={18} className="text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              Pesquisa Universal
            </h1>
          </div>
          <p className="text-sm text-slate-400 mb-5">
            Pesquisa colaboradores, cursos, conteúdos, PDIs e mais
          </p>

          {/* Search bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
              placeholder="Pesquisar em toda a plataforma..."
              className="w-full pl-12 pr-12 py-4 text-sm border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:border-indigo-400 focus:shadow-md transition-all"
            />
            {query && (
              <button
                onClick={clear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}

            {/* Autocomplete dropdown */}
            {suggestions.length > 0 && !results && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(s.text);
                      doSearch(s.text);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                  >
                    <Clock size={12} className="text-slate-300 shrink-0" />
                    <span className="text-sm text-slate-700">{s.text}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {s.type}
                    </span>
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
                <button
                  key={key}
                  onClick={() => searchByType(key, conf.path)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${conf.bg} ${conf.color} border-transparent hover:border-current`}
                >
                  <Icon size={12} />
                  {conf.label}
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
          <SuggestionsPanel
            onSearch={(q) => {
              setQuery(q);
              doSearch(q);
            }}
          />
        )}

        {!loading && results && (
          <ResultsView
            data={results}
            activeType={activeType}
            setActiveType={setActiveType}
          />
        )}
      </div>
    </div>
  );
}
