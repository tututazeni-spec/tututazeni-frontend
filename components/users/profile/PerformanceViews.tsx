// components/users/profile/PerformanceViews.tsx
// Desempenho, avaliações 360°, PDI e carreira (apresentação).

import { Scale, Star, Users } from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { EvalResults } from '@/components/evaluation/types';
import type { QueryData } from '@/hooks/useUserProfileData';
import { InfoCard, EmptyState, LoadingRows } from './shared';
import {
  careerPlanRows,
  completedIntent,
  finalScoreLabel,
  priorityIntent,
  qualitativeTitle,
  QUALITATIVE_KEYS,
} from './logic';
import {
  type UserEval360CycleEntry,
  type DevelopmentPlansResponse,
  type CareerProfile,
} from '../types';

export function PerformanceView({ data, isLoading }: QueryData<EvalResults>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.hasResults === false)
    return <EmptyState>Sem avaliações de desempenho</EmptyState>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <NavyStatCard
          icon={Star}
          tone="blue"
          label="Pontuação final"
          value={data.finalScore}
          sub={data.scoreLabel}
        />
        <NavyStatCard
          icon={Users}
          tone="green"
          label="Avaliadores"
          value={data.totalEvaluators}
        />
        {data.concordance && (
          <NavyStatCard
            icon={Scale}
            tone="orange"
            label="Gap auto vs. outros"
            value={data.concordance.gap}
            sub={data.concordance.label}
          />
        )}
      </div>
      {data.qualitative && (
        <div className="grid grid-cols-3 gap-3">
          {QUALITATIVE_KEYS.map((key) => (
            <Card key={key} className="p-4">
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">
                {qualitativeTitle(key)}
              </div>
              {data.qualitative[key].length === 0 ? (
                <div className="text-xs text-ink-faint">—</div>
              ) : (
                <ul className="text-xs text-ink-muted space-y-1 list-disc list-inside">
                  {data.qualitative[key].map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvaluationsView({
  data,
  isLoading,
}: QueryData<UserEval360CycleEntry[]>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.length === 0)
    return <EmptyState>Sem avaliações 360° registadas</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Ciclo</TableHeaderCell>
          <TableHeaderCell>Período</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell>Pontuação final</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((c) => (
          <TableRow key={c.cycleId}>
            <TableCell>
              <div className="text-sm font-medium text-ink">{c.cycleName}</div>
              <div className="text-xs text-ink-faint">{c.cycleType}</div>
            </TableCell>
            <TableCell className="text-xs text-ink-faint">
              {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
            </TableCell>
            <TableCell>
              <Badge intent={completedIntent(c.participantStatus)}>
                {c.participantStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">
              {finalScoreLabel(c.finalScore)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PdiView({
  data,
  isLoading,
}: QueryData<DevelopmentPlansResponse>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.data.length === 0)
    return <EmptyState>Sem PDI registados</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Plano</TableHeaderCell>
          <TableHeaderCell>Prioridade</TableHeaderCell>
          <TableHeaderCell>Progresso</TableHeaderCell>
          <TableHeaderCell>Período</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.data.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="text-sm font-medium text-ink">{p.name}</div>
              <div className="text-xs text-ink-faint">
                {p.manager?.fullName ?? '—'}
              </div>
            </TableCell>
            <TableCell>
              <Badge intent={priorityIntent(p.priority)}>{p.priority}</Badge>
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">
              {p.overallProgress}%
            </TableCell>
            <TableCell className="text-xs text-ink-faint">
              {p.period ?? '—'}
            </TableCell>
            <TableCell>
              <Badge intent={completedIntent(p.status)}>{p.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CareerView({ data, isLoading }: QueryData<CareerProfile>) {
  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState>Sem dados de carreira</EmptyState>;

  return (
    <div className="space-y-4">
      <InfoCard title="Plano de carreira activo" rows={careerPlanRows(data)} />
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Histórico de cargos
        </div>
        {data.careerHistory.length === 0 ? (
          <EmptyState>Sem histórico de cargos</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Cargo</TableHeaderCell>
                <TableHeaderCell>Início</TableHeaderCell>
                <TableHeaderCell>Fim</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.careerHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm text-ink">
                    {h.position?.title ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-faint">
                    {fmtDate(h.startedAt)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-faint">
                    {h.endedAt ? fmtDate(h.endedAt) : 'Actual'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {data.successionPlan && (
        <InfoCard
          title="Plano de sucessão"
          rows={[['Posição-alvo', data.successionPlan.position?.name]]}
        />
      )}
    </div>
  );
}
