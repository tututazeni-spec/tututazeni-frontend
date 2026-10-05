// components/scalability/HistoryCharts.tsx
// modulo_scalability.md §27-29 — histórico persistido (filas, endpoints, médias horárias)
// e recomendações de infraestrutura. Auto-contidos: cada componente faz o seu pedido.

'use client';

import { useMemo, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AreaLineChart,
  type AreaLineSeries,
} from '@/components/ui/charts/AreaLineChart';
import { Header, Note } from './InfraTabs';

const fmtTime = (iso: string, withDate: boolean) =>
  new Date(iso).toLocaleString(
    'pt-PT',
    withDate
      ? { day: '2-digit', month: '2-digit', hour: '2-digit' }
      : { hour: '2-digit', minute: '2-digit' },
  );

/** Série com x = índice (a escala do gráfico não aguenta timestamps) e xLabel = hora. */
function toSeries<T>(
  label: string,
  rows: T[],
  at: (r: T) => string,
  value: (r: T) => number,
  withDate: boolean,
): AreaLineSeries {
  return {
    label,
    points: rows.map((r, i) => ({
      x: i,
      y: value(r),
      xLabel: fmtTime(at(r), withDate),
    })),
  };
}

function Windowed({
  title,
  sub,
  options,
  value,
  onChange,
  children,
}: {
  title: string;
  sub?: string;
  options: Array<{ value: number; label: string }>;
  value: number;
  onChange: (v: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Header title={title} sub={sub} />
        <select
          aria-label={`Janela de ${title}`}
          className="rounded-md border border-line bg-surface px-2 py-1 font-body text-sm text-ink"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <CardBody>{children}</CardBody>
      </Card>
    </div>
  );
}

const HOURS = [
  { value: 6, label: 'Últimas 6 h' },
  { value: 24, label: 'Últimas 24 h' },
  { value: 72, label: 'Últimos 3 dias' },
  { value: 168, label: 'Últimos 7 dias' },
];

// ─── Filas ─────────────────────────────────────────────────

interface QueueRow {
  capturedAt: string;
  queue: string;
  pending: number;
  processing: number;
  failed: number;
}

export function QueueHistoryChart() {
  const [hours, setHours] = useState(24);
  const { data } = useApiQuery<QueueRow[]>(
    ['scalability', 'history-queues', hours],
    '/scalability/history/queues',
    { staleTime: STALE_TIME.DYNAMIC, params: { hours }, retry: false },
  );

  const series = useMemo(() => {
    const rows = data ?? [];
    const queues = [...new Set(rows.map((r) => r.queue))];
    return queues.map((q) =>
      toSeries(
        q,
        rows.filter((r) => r.queue === q),
        (r) => r.capturedAt,
        (r) => r.pending,
        hours > 24,
      ),
    );
  }, [data, hours]);

  return (
    <Windowed
      title="Histórico das filas"
      sub="Jobs pendentes por fila (amostra de 5 em 5 minutos)"
      options={HOURS}
      value={hours}
      onChange={setHours}
    >
      {series.length ? (
        <AreaLineChart series={series} />
      ) : (
        <EmptyState
          title="Sem histórico"
          description="Ainda não há amostras de filas neste período."
        />
      )}
    </Windowed>
  );
}

// ─── Endpoints ─────────────────────────────────────────────

interface EndpointRow {
  capturedAt: string;
  endpoint: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  throughput: number;
  errorRate: number;
}

export function EndpointHistoryChart() {
  const [hours, setHours] = useState(24);
  const [endpoint, setEndpoint] = useState('');
  const { data } = useApiQuery<EndpointRow[]>(
    ['scalability', 'history-endpoints', hours],
    '/scalability/history/endpoints',
    { staleTime: STALE_TIME.DYNAMIC, params: { hours }, retry: false },
  );

  const endpoints = useMemo(() => {
    const total = new Map<string, number>();
    for (const r of data ?? [])
      total.set(r.endpoint, (total.get(r.endpoint) ?? 0) + r.throughput);
    return [...total.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e);
  }, [data]);
  const selected = endpoint || endpoints[0] || '';
  const rows = useMemo(
    () => (data ?? []).filter((r) => r.endpoint === selected),
    [data, selected],
  );

  const series = useMemo(
    () =>
      (['p50Ms', 'p95Ms', 'p99Ms'] as const).map((k) =>
        toSeries(
          k.slice(0, 3),
          rows,
          (r) => r.capturedAt,
          (r) => r[k],
          hours > 24,
        ),
      ),
    [rows, hours],
  );

  return (
    <Windowed
      title="Histórico de latência por endpoint"
      sub="p50, p95 e p99 em ms (amostra de 5 em 5 minutos)"
      options={HOURS}
      value={hours}
      onChange={setHours}
    >
      {rows.length ? (
        <div className="flex flex-col gap-3">
          <select
            aria-label="Endpoint"
            className="max-w-full self-start rounded-md border border-line bg-surface px-2 py-1 font-body text-sm text-ink"
            value={selected}
            onChange={(e) => setEndpoint(e.target.value)}
          >
            {endpoints.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <AreaLineChart series={series} yFormat={(v) => `${v}ms`} />
        </div>
      ) : (
        <EmptyState
          title="Sem histórico"
          description="Ainda não há amostras de endpoints neste período."
        />
      )}
    </Windowed>
  );
}

// ─── Médias horárias ───────────────────────────────────────

interface HourlyRow {
  hour: string;
  avgCpu: number;
  maxCpu: number;
  avgMemory: number;
  maxConcurrent: number;
  maxP95Ms: number;
}

const DAYS = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
];

export function HourlyHistoryCharts() {
  const [days, setDays] = useState(30);
  const { data } = useApiQuery<HourlyRow[]>(
    ['scalability', 'history-hourly', days],
    '/scalability/history/hourly',
    { staleTime: STALE_TIME.DYNAMIC, params: { days }, retry: false },
  );
  const rows = data ?? [];

  return (
    <Windowed
      title="Tendência (agregado por hora)"
      sub="CPU, memória e pico de utilizadores simultâneos, a partir das amostras agregadas"
      options={DAYS}
      value={days}
      onChange={setDays}
    >
      {rows.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AreaLineChart
            series={[
              toSeries('CPU média', rows, (r) => r.hour, (r) => r.avgCpu, true),
              toSeries('RAM média', rows, (r) => r.hour, (r) => r.avgMemory, true),
            ]}
            yFormat={(v) => `${v}%`}
          />
          <AreaLineChart
            series={[
              toSeries(
                'Simultâneos (pico)',
                rows,
                (r) => r.hour,
                (r) => r.maxConcurrent,
                true,
              ),
            ]}
          />
        </div>
      ) : (
        <EmptyState
          title="Sem dados agregados"
          description="A agregação horária corre à noite; ainda não há horas fechadas."
        />
      )}
    </Windowed>
  );
}

// ─── Recomendações ─────────────────────────────────────────

interface RecommendationsData {
  basedOnHours: number;
  note: string;
  recommendations: Array<{
    key: string;
    area: string;
    priority: 'ALTA' | 'MEDIA' | 'BAIXA';
    title: string;
    detail: string;
  }>;
}

const PRIORITY: Record<
  'ALTA' | 'MEDIA' | 'BAIXA',
  { label: string; intent: 'danger' | 'warning' | 'neutral' }
> = {
  ALTA: { label: 'Alta', intent: 'danger' },
  MEDIA: { label: 'Média', intent: 'warning' },
  BAIXA: { label: 'Baixa', intent: 'neutral' },
};

export function RecommendationsCard() {
  const { data } = useApiQuery<RecommendationsData>(
    ['scalability', 'recommendations'],
    '/scalability/recommendations',
    { staleTime: STALE_TIME.DYNAMIC, retry: false },
  );
  if (!data) return null;

  return (
    <div className="flex flex-col gap-3">
      <Header
        title="Recomendações de infraestrutura"
        sub="Sugestões baseadas no estado atual e na tendência do histórico"
      />
      <Card>
        <CardBody>
          {data.recommendations.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">
              Sem recomendações — a infraestrutura está dentro dos limites.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recommendations.map((r) => (
                <li key={r.key} className="flex items-start gap-3">
                  <Badge intent={PRIORITY[r.priority].intent} dot>
                    {PRIORITY[r.priority].label}
                  </Badge>
                  <div>
                    <p className="font-body text-sm font-semibold text-ink">
                      {r.title}
                    </p>
                    <p className="font-body text-sm text-ink-muted">
                      {r.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Note>{data.note}</Note>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
