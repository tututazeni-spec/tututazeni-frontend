// components/ai-tutor/KnowledgeBaseView.tsx
// Vista "Base de Conhecimento" (docs/ai-tutor.md secção 3): mostra os
// conteúdos autorizados que alimentam o RAG do tutor e permite testar a
// pesquisa que também corre, em segundo plano, a cada mensagem do Chat.

'use client';

import { useState } from 'react';
import {
  Search,
  BookOpen,
  GraduationCap,
  Library,
  FileText,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { KnowledgeSource, KnowledgeSources } from './types';

const TYPE_ICON: Record<KnowledgeSource['type'], typeof BookOpen> = {
  COURSE: GraduationCap,
  LESSON: BookOpen,
  LIBRARY: Library,
  DOCUMENT: FileText,
};

export function KnowledgeBaseView() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [results, setResults] = useState<KnowledgeSource[] | null>(null);
  const [searching, setSearching] = useState(false);

  const { data: sources, isLoading: loadingSources } =
    useApiQuery<KnowledgeSources>(
      queryKeys.aiTutor.knowledgeSources(),
      '/ai-tutor/knowledge/sources',
      { staleTime: STALE_TIME.SEMI_STATIC },
    );

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const data = await apiClient.get<KnowledgeSource[]>(
        '/ai-tutor/knowledge/search',
        {
          params: { q, limit: 10 },
        },
      );
      setResults(data);
      setSearched(q);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {loadingSources ? (
        <Skeleton
          rows={1}
          wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
          itemClassName="skeleton-shimmer h-[155px] rounded-2xl"
        />
      ) : sources ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <NavyStatCard
            icon={GraduationCap}
            tone="blue"
            label="Cursos indexados"
            value={sources.courses}
          />
          <NavyStatCard
            icon={BookOpen}
            tone="blue"
            label="Lições com conteúdo"
            value={sources.lessons}
          />
          <NavyStatCard
            icon={Library}
            tone="orange"
            label="Itens da Biblioteca"
            value={sources.libraryItems}
          />
          <NavyStatCard
            icon={FileText}
            tone="green"
            label="Documentos internos"
            value={sources.documents}
            sub="normas, manuais, políticas…"
          />
        </div>
      ) : null}

      {sources && sources.documentsByCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sources.documentsByCategory.map((d) => (
            <Badge key={d.category} intent="neutral">
              {d.category} · {d.count}
            </Badge>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-1">
          Pesquisar na Base de Conhecimento
        </div>
        <p className="font-body text-xs text-ink-faint mb-4">
          A mesma pesquisa corre automaticamente sempre que um colaborador
          pergunta algo à Ísis, para responder com fontes autorizadas em vez de
          inventar.
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Ex: política de férias, gestão de conflitos, crédito habitação…"
            className="flex-1"
          />
          <Button onClick={search} loading={searching} disabled={!query.trim()}>
            <Search size={14} strokeWidth={1.75} />
            Pesquisar
          </Button>
        </div>
      </Card>

      {results && (
        <div className="space-y-2">
          <div className="font-body text-xs text-ink-faint">
            {results.length} resultado(s) para &quot;{searched}&quot;
          </div>
          {results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Sem resultados autorizados"
              description="Não foram encontrados conteúdos autorizados para esta pesquisa — pode ser uma lacuna de conteúdo a colmatar."
            />
          ) : (
            results.map((r, i) => {
              const Icon = TYPE_ICON[r.type];
              return (
                <Card key={i} className="p-4 flex gap-3">
                  <div className="w-9 h-9 bg-primary-subtle rounded-control flex items-center justify-center text-primary flex-shrink-0">
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-body text-sm font-medium text-ink">
                      {r.label}
                    </div>
                    <div className="font-body text-xs text-ink-faint mt-1 leading-relaxed">
                      {r.snippet}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
