// components/search/SuggestionsPanel.tsx
// Auto-contido: busca as suas próprias sugestões/histórico (não depende
// do resultado de pesquisa do container).

import { Clock, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ResultCard } from './ResultCard';
import type { HistoryResponse, SuggestionsData } from './types';

interface SuggestionsPanelProps {
  onSearch: (q: string) => void;
}

export function SuggestionsPanel({ onSearch }: SuggestionsPanelProps) {
  const { data } = useApiQuery<SuggestionsData>(
    queryKeys.search.suggestions(),
    '/search/suggestions',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  const { data: historyResp } = useApiQuery<HistoryResponse>(
    queryKeys.search.history(),
    '/search/history',
    { params: { limit: 8 }, staleTime: STALE_TIME.DYNAMIC, retry: false },
  );
  const history = historyResp?.history ?? [];

  return (
    <div className="space-y-6">
      {/* Recent searches */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={12} />
            Pesquisas Recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 8).map((h, i) => (
              <button
                key={i}
                onClick={() => onSearch(h.query)}
                className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
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
            <TrendingUp size={12} />
            Em Alta
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data?.trendingSearches ?? []).slice(0, 6).map((t, i) => (
              <button
                key={i}
                onClick={() => onSearch(t)}
                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended courses */}
      {(data?.recommendedCourses ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Cursos Recomendados
          </h3>
          <div className="space-y-1">
            {(data?.recommendedCourses ?? []).map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Popular content */}
      {(data?.popularContent ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Conteúdo Popular
          </h3>
          <div className="space-y-1">
            {(data?.popularContent ?? []).slice(0, 4).map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
