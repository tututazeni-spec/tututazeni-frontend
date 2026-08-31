// components/search/SearchView.tsx

import { Search, X, Clock } from 'lucide-react';
import type { RefObject } from 'react';
import { IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header — mesmo padrão de app/(platform)/notifications|courses|knowledge */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">
          Pesquisa Universal
        </h1>
        <p className="mt-0.5 font-body text-sm text-ink-faint">
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={18}
          strokeWidth={1.75}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
          placeholder="Pesquisar em toda a plataforma..."
          className="w-full rounded-panel py-4 pl-12 pr-12 text-sm shadow-resting transition-shadow focus:shadow-hover"
        />
        {query && (
          <IconButton
            icon={X}
            label="Limpar pesquisa"
            intent="ghost"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          />
        )}

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && !results && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-card border border-border bg-surface shadow-elevated">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(s.text);
                  doSearch(s.text);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-sunken"
              >
                <Clock
                  size={14}
                  strokeWidth={1.75}
                  className="shrink-0 text-ink-faint"
                />
                <span className="font-body text-sm text-ink">{s.text}</span>
                <span className="ml-auto font-body text-[10px] text-ink-faint">
                  {s.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick type filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(TYPE_CONFIG).map(([key, conf]) => {
          return (
            <button
              key={key}
              onClick={() => searchByType(key, conf.path)}
              className={`flex items-center rounded-control border border-transparent px-3 py-1.5 font-body text-xs hover:border-current ${conf.bg} ${conf.color}`}
            >
              {conf.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-subtle border-t-primary" />
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
