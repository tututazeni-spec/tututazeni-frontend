// components/ai-tutor/AnalyticsView.tsx
// Vista "Analytics" (docs/ai-tutor.md secção 7) — métricas detalhadas de
// utilização do AI Tutor para ADMIN/RH. Complementa os indicadores já
// disponíveis em Visão Geral com utilização, perguntas por curso e o
// indicador de lacunas de conteúdo ("perguntas sem resposta").

'use client';

import { HelpCircle, Percent, Timer, Users2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AiTutorAnalytics } from './types';

export function AnalyticsView() {
  const { data, isLoading: loading } = useApiQuery<AiTutorAnalytics>(
    queryKeys.aiTutor.analytics(),
    '/ai-tutor/analytics',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-3"
        itemClassName="skeleton-shimmer h-28 rounded-card"
      />
    );
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <KpiCard icon={Users2} label="Utilizadores do AI Tutor" value={data.utilizadoresDoAiTutor} />
        <KpiCard
          icon={Percent}
          label="Taxa de utilização"
          value={`${data.taxaDeUtilizacao}%`}
          intent="accent"
          sub="colaboradores activos que já usaram a Ísis"
        />
        <KpiCard
          icon={Users2}
          label="Sessões por colaborador"
          value={data.sessoesPorColaborador}
          intent="info"
        />
        <KpiCard
          icon={Timer}
          label="Tempo médio por sessão"
          value={`${data.tempoMedioMinutos} min`}
          intent="warning"
        />
        <KpiCard icon={HelpCircle} label="Exercícios realizados" value={data.exerciciosRealizados} />
        <KpiCard
          icon={Percent}
          label="Recomendações aceites"
          value={data.recomendacoesAceites}
          intent="success"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
            Perguntas por curso
          </div>
          {data.perguntasPorCurso.length === 0 ? (
            <div className="px-4 py-4 font-body text-sm text-ink-faint">Sem dados ainda.</div>
          ) : (
            data.perguntasPorCurso.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
              >
                <span className="font-body text-sm text-ink truncate">{c.title}</span>
                <span className="font-body text-xs text-ink-faint flex-shrink-0">
                  {c.count} perguntas
                </span>
              </div>
            ))
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
            Perguntas sem resposta autorizada
          </div>
          <p className="px-4 pt-3 font-body text-xs text-ink-faint">
            Perguntas repetidas para as quais a Ísis não encontrou fontes autorizadas — candidatas
            a lacunas de conteúdo.
          </p>
          {data.perguntasSemResposta.length === 0 ? (
            <div className="px-4 py-4 font-body text-sm text-ink-faint">
              Nenhuma pergunta repetida sem resposta autorizada.
            </div>
          ) : (
            data.perguntasSemResposta.map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
              >
                <span className="font-body text-sm text-ink truncate">{q.question}</span>
                <span className="font-body text-xs text-ink-faint flex-shrink-0">{q.count}×</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
