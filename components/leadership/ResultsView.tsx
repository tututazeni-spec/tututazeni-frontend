// components/leadership/ResultsView.tsx
// Separador "Resultados": KPIs do programa (GET /leadership/programs/:id/
// outcomes) — conclusão/abandono, presença, nota, evolução de competências,
// projectos, distribuição de readiness, sucessão e custo. Métricas sem fonte
// de dados no backend (satisfação, promoções, mobilidade, ROI) aparecem como
// "sem dados".

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ASSESSMENT_STAGE_LABELS,
  PARTICIPANT_STATUS_CFG,
  READINESS_CFG,
} from './constants';
import type { ProgramOutcomes, ReadinessLevel } from './types';

export interface ResultsViewProps {
  programId: number;
}

const fmtPct = (v: number | null) => (v == null ? '—' : `${v}%`);
const fmtNum = (v: number | null) => (v == null ? '—' : String(v));

export function ResultsView({ programId }: ResultsViewProps) {
  const { data, isLoading, error, refetch } = useApiQuery<ProgramOutcomes>(
    queryKeys.leadership.outcomes(programId),
    `/leadership/programs/${programId}/outcomes`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <KpiCard label="Participantes" value={data.participants.total} />
        <KpiCard label="Taxa de conclusão" value={fmtPct(data.participants.completionRate)} intent="success" />
        <KpiCard label="Taxa de abandono" value={fmtPct(data.participants.dropoutRate)} intent="danger" />
        <KpiCard label="Presença média" value={fmtPct(data.attendance.averageRate)} />
        <KpiCard label="Nota final média" value={fmtNum(data.score.averageFinalScore)} />
        <KpiCard label="Certificados" value={data.certificates.issued} />
        <KpiCard label="Prontos agora" value={data.readiness.readyNow} intent="success" />
        <KpiCard label="Ligados a sucessão" value={data.succession.linked} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title="Participantes por estado">
          {Object.entries(data.participants.byStatus).map(([k, v]) => (
            <Row key={k} label={PARTICIPANT_STATUS_CFG[k]?.label ?? k} value={String(v)} />
          ))}
        </Breakdown>

        <Breakdown title="Distribuição de readiness">
          {Object.keys(data.readiness.byLevel).length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem dados.</p>
          ) : (
            Object.entries(data.readiness.byLevel).map(([k, v]) => (
              <Row
                key={k}
                label={READINESS_CFG[k as ReadinessLevel]?.label ?? k}
                value={String(v)}
              />
            ))
          )}
        </Breakdown>

        <Breakdown title="Evolução de competências">
          <Row label={ASSESSMENT_STAGE_LABELS.INITIAL} value={fmtNum(data.competencyEvolution.initialAvg)} />
          <Row label={ASSESSMENT_STAGE_LABELS.FINAL} value={fmtNum(data.competencyEvolution.finalAvg)} />
          <Row label="Variação" value={fmtNum(data.competencyEvolution.delta)} />
        </Breakdown>

        <Breakdown title="Custo do programa">
          <Row
            label="Planeado"
            value={`${data.cost.totalPlanned} ${data.cost.currency}`}
          />
          <Row label="Real" value={`${data.cost.totalActual} ${data.cost.currency}`} />
          {data.cost.byCategory &&
            Object.entries(data.cost.byCategory).map(([k, v]) => (
              <Row key={k} label={k} value={`${v.actual} / ${v.planned}`} />
            ))}
        </Breakdown>

        <Breakdown title="Projetos">
          <Row label="Total" value={String(data.projects.total)} />
          <Row label="Concluídos" value={String(data.projects.completed)} />
          <Row label="Nota média" value={fmtNum(data.projects.averageScore)} />
        </Breakdown>

        <Breakdown title="Sem fonte de dados">
          <Row label="Satisfação" value="sem dados" />
          <Row label="Promoções" value="sem dados" />
          <Row label="Mobilidade" value="sem dados" />
          <Row label="ROI" value="sem dados" />
        </Breakdown>
      </div>
    </div>
  );
}

function Breakdown({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h4 className="mb-2 font-body text-sm font-semibold text-ink">{title}</h4>
      <dl className="space-y-1">{children}</dl>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-body text-xs">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
