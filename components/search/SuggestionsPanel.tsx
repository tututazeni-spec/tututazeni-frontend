// components/search/SuggestionsPanel.tsx
// Auto-contido: busca as suas próprias sugestões/histórico (não depende
// do resultado de pesquisa do container).

import { Clock, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
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
          <h3 className="mb-3 flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Clock size={14} strokeWidth={1.75} />
            Pesquisas Recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 8).map((h, i) => (
              <Button
                key={i}
                intent="ghost"
                size="sm"
                onClick={() => onSearch(h.query)}
                className="bg-surface-sunken"
              >
                {h.query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {(data?.trendingSearches ?? []).length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <TrendingUp size={14} strokeWidth={1.75} />
            Em Alta
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data?.trendingSearches ?? []).slice(0, 6).map((t, i) => (
              <Button key={i} intent="secondary" size="sm" onClick={() => onSearch(t)}>
                {t}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended courses */}
      {(data?.recommendedCourses ?? []).length > 0 && (
        <div>
          <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
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
          <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
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
