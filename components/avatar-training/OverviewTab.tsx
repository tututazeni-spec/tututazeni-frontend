// components/avatar-training/OverviewTab.tsx
// Visão Geral (docs/Avatar_Training.md §3): indicadores com fórmula/fonte/período,
// «Sem dados» quando não existem dados e alertas. GET /avatar-training/overview.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cpu,
  FileSearch,
  MessageSquareWarning,
  MessagesSquare,
  Play,
  ServerCrash,
  Target,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AvatarProgram, Indicator, Overview } from './types';

const SCOPE_LABEL = {
  ALL: 'Toda a organização',
  TEAM: 'A sua equipa',
  SELF: 'Os seus dados',
} as const;

const ALL = 'ALL';

function OverviewFilters({
  from,
  to,
  departmentId,
  programId,
  onChange,
}: {
  from: string;
  to: string;
  departmentId: string;
  programId: string;
  onChange: (patch: Partial<Record<'from' | 'to' | 'departmentId' | 'programId', string>>) => void;
}) {
  const deptParams = { limit: 200 };
  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    { params: deptParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const programs = useApiQuery<AvatarProgram[]>(
    queryKeys.avatarTraining.programs({}),
    '/avatar-training/programs',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="De" htmlFor="ov-from">
        <Input
          id="ov-from"
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </FormField>
      <FormField label="Até" htmlFor="ov-to">
        <Input
          id="ov-to"
          type="date"
          value={to}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </FormField>
      <FormField label="Departamento" htmlFor="ov-dept">
        <Select
          value={departmentId}
          onValueChange={(v) => onChange({ departmentId: v })}
          items={[
            { value: ALL, label: 'Todos' },
            ...(depts.data?.data ?? []).map((d) => ({
              value: String(d.id),
              label: d.name,
            })),
          ]}
        />
      </FormField>
      <FormField label="Formação" htmlFor="ov-prog">
        <Select
          value={programId}
          onValueChange={(v) => onChange({ programId: v })}
          items={[
            { value: ALL, label: 'Todas' },
            ...(programs.data ?? []).map((p) => ({
              value: String(p.id),
              label: p.title,
            })),
          ]}
        />
      </FormField>
    </div>
  );
}

// Ícone e tom por significado: positivos verde, consumo/tempo laranja, problemas vermelho.
const INDICATOR_STYLE: Record<string, { icon: LucideIcon; tone: NavyStatTone }> = {
  SESSIONS: { icon: MessagesSquare, tone: 'blue' },
  COMPLETION_RATE: { icon: CheckCircle2, tone: 'green' },
  AVG_SCORE: { icon: Target, tone: 'blue' },
  AVG_DURATION: { icon: Timer, tone: 'orange' },
  ACTIVE_LEARNERS: { icon: Users, tone: 'green' },
  SIMULATIONS_DONE: { icon: Play, tone: 'blue' },
  PASS_RATE: { icon: Award, tone: 'green' },
  EVOLUTION: { icon: TrendingUp, tone: 'green' },
  MANDATORY: { icon: ClipboardCheck, tone: 'green' },
  ANSWER_QUALITY: { icon: MessageSquareWarning, tone: 'red' },
  TECH_CONSUMPTION: { icon: Cpu, tone: 'orange' },
  INCIDENTS: { icon: AlertOctagon, tone: 'red' },
  MANDATORY_OVERDUE: { icon: Clock, tone: 'red' },
  CONTENT_TO_REVIEW: { icon: FileSearch, tone: 'orange' },
  PROVIDER_FAILURES: { icon: ServerCrash, tone: 'red' },
  COST_LIMIT: { icon: Wallet, tone: 'orange' },
};
const DEFAULT_INDICATOR_STYLE = { icon: BarChart3, tone: 'blue' as NavyStatTone };

function IndicatorCard({ i }: { i: Indicator }) {
  const noData = i.status !== 'OK' || i.value === null;
  const { icon, tone } = INDICATOR_STYLE[i.code] ?? DEFAULT_INDICATOR_STYLE;
  return (
    <div title={`${i.formula}
Fonte: ${i.source}
Actualizado em ${formatDateTime(i.updatedAt)}`}>
      <NavyStatCard
        icon={icon}
        tone={tone}
        label={i.label}
        value={
          i.status === 'RESTRICTED' ? 'Restrito' : noData ? '' : (i.value as number)
        }
        sub={noData ? undefined : i.unit}
      />
    </div>
  );
}

export function OverviewTab() {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    departmentId: ALL,
    programId: ALL,
  });
  // Datas locais → limites do dia; o backend usa os últimos 30 dias por omissão.
  const invalidRange = !!filters.from && !!filters.to && filters.from > filters.to;
  const params: Record<string, string | number> = {};
  // Intervalo inválido: ignora as datas (o backend responderia 400 e a aba perderia os filtros).
  if (!invalidRange) {
    if (filters.from) params.from = new Date(`${filters.from}T00:00:00`).toISOString();
    if (filters.to) params.to = new Date(`${filters.to}T23:59:59.999`).toISOString();
  }
  if (filters.departmentId !== ALL) params.departmentId = Number(filters.departmentId);
  if (filters.programId !== ALL) params.programId = Number(filters.programId);

  const { data, isLoading, error, refetch } = useApiQuery<Overview>(
    queryKeys.avatarTraining.overview(params),
    '/avatar-training/overview',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        itemClassName="skeleton-shimmer h-[155px] rounded-2xl"
      />
    );

  return (
    <div className="space-y-6">
      <OverviewFilters
        {...filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />
      {invalidRange && (
        <p role="alert" className="font-body text-xs text-danger-ink">
          O início do período é posterior ao fim.
        </p>
      )}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <div
              key={a.code}
              role="alert"
              className={`flex items-start gap-2 rounded-card border px-4 py-3 font-body text-sm ${
                a.severity === 'CRITICAL'
                  ? 'border-danger bg-danger-subtle text-danger-ink'
                  : 'border-warning bg-warning-subtle text-warning-ink'
              }`}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.indicators.map((i) => (
          <IndicatorCard key={i.code} i={i} />
        ))}
      </div>

      <p className="font-body text-xs text-ink-faint">
        Âmbito: {SCOPE_LABEL[data.scope]} · Período{' '}
        {formatDateTime(data.period.from)} – {formatDateTime(data.period.to)} ·
        Actualizado em {formatDateTime(data.generatedAt)}
        {data.truncated && ' · Resultados truncados (limite de leitura)'}
      </p>
    </div>
  );
}
