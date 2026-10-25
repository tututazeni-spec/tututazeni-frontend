'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { LoadTestModal } from '../LoadTestModal';
import { CardTitleBar } from '../InfraTabs';
import type {
  DashboardData,
  PerformanceMetricsData,
  PerfClass,
} from '../types';
import {
  INTENT_TEXT,
  SectionHeader,
  StateIntent,
  ThresholdBar,
} from './shared';

const PERF_CLASS: Record<
  PerfClass,
  { label: string; intent: 'success' | 'info' | 'warning' | 'danger' }
> = {
  EXCELENTE: { label: 'Excelente', intent: 'success' },
  NORMAL: { label: 'Normal', intent: 'info' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  DEGRADACAO: { label: 'Degradação', intent: 'danger' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

function PerformanceKpis({ perf }: { perf: PerformanceMetricsData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SectionHeader
          title="KPIs Transversais"
          sub="API, base de dados, frontend e filas"
        />
        {perf.overall && (
          <Badge intent={PERF_CLASS[perf.overall].intent} dot>
            {PERF_CLASS[perf.overall].label}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {perf.kpis.map((k) => (
          <Card
            key={k.key}
            className="transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100"
          >
            <CardBody>
              <div className="flex items-center justify-between gap-2">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {k.label}
                </span>
                {k.classification && (
                  <Badge intent={PERF_CLASS[k.classification].intent} dot>
                    {PERF_CLASS[k.classification].label}
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-display text-xl font-bold tabular-nums text-ink">
                {k.value === null ? '—' : k.value.toLocaleString()}
                {k.value !== null && (
                  <span className="ml-1 text-sm font-normal text-ink-muted">
                    {k.unit}
                  </span>
                )}
              </p>
              {k.note && (
                <p className="mt-1 font-body text-micro text-ink-faint">
                  {k.note}
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
      {perf.slowEndpoints.length > 0 && (
        <Card>
          <CardBody>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Endpoints a vigiar
            </p>
            <table className="w-full font-body text-sm">
              <tbody>
                {perf.slowEndpoints.map((e) => (
                  <tr key={e.endpoint} className="border-t border-border">
                    <td className="py-1.5 text-ink">{e.endpoint}</td>
                    <td className="py-1.5 text-right text-ink-muted">
                      p95 {e.p95Ms} ms
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {e.errorRate}% erros
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

interface PerformanceTabProps {
  data: DashboardData;
  perf?: PerformanceMetricsData | null;
}

export function PerformanceTab({ data, perf = null }: PerformanceTabProps) {
  const p = data.performanceSummary;
  const [configuring, setConfiguring] = useState(false);
  const metrics = [
    {
      label: 'CPU',
      value: p.cpuUsagePercent,
      max: 100,
      unit: '%',
      warn: 70,
      danger: 85,
    },
    {
      label: 'Memória',
      value: p.memoryUsagePercent,
      max: 100,
      unit: '%',
      warn: 75,
      danger: 90,
    },
    {
      label: 'Req/min',
      value: p.requestsPerMinute,
      max: 10000,
      unit: '',
      warn: 7000,
      danger: 9000,
    },
    {
      label: 'Latência (ms)',
      value: p.avgLatencyMs,
      max: 3000,
      unit: 'ms',
      warn: 1500,
      danger: 2500,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        banner
        title="Performance em Tempo Real"
        sub="Últimos dados capturados pelo sistema de monitorização"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.map((m) => {
          const pct = (m.value / m.max) * 100;
          const isDanger = m.value >= m.danger;
          const isWarn = !isDanger && m.value >= m.warn;
          const state: StateIntent | undefined = isDanger
            ? 'danger'
            : isWarn
              ? 'warning'
              : undefined;
          return (
            <Card key={m.label} className="overflow-hidden">
              <CardTitleBar>{m.label}</CardTitleBar>
              <CardBody>
                <div className="mb-3 flex items-center justify-end">
                  <span
                    className={cn(
                      'font-display text-xl font-bold tabular-nums',
                      state ? INTENT_TEXT[state] : 'text-ink',
                    )}
                  >
                    {m.value}
                    {m.unit}
                  </span>
                </div>
                <ThresholdBar pct={pct} state={state} />
                <div className="mt-2 flex justify-between font-body text-micro text-ink-faint">
                  <span>0</span>
                  <span>{pct.toFixed(1)}% da capacidade</span>
                  <span>
                    Aviso {m.warn}
                    {m.unit} · Limite {m.danger}
                    {m.unit}
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {perf && <PerformanceKpis perf={perf} />}

      {/* Load test CTA */}
      <div className="flex items-center justify-between rounded-card border border-dashed border-border-strong bg-surface-sunken p-5">
        <div>
          <p className="font-body text-sm font-semibold text-ink">
            Teste de Carga (Stress Test)
          </p>
          <p className="mt-0.5 font-body text-xs text-ink-muted">
            Simular picos de utilizadores simultâneos para validar a
            escalabilidade
          </p>
        </div>
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setConfiguring(true)}
        >
          Configurar Teste
        </Button>
      </div>

      {configuring && <LoadTestModal onClose={() => setConfiguring(false)} />}
    </div>
  );
}
