'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import {
  Activity,
  Boxes,
  Gauge,
  ListChecks,
  Clock,
  Timer,
  RotateCcw,
  TriangleAlert,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { CardTitleBar } from '../InfraTabs';
import type { QueueMetricsData } from '../types';
import { SectionHeader, timeAgo } from './shared';

// ─── FILAS & JOBS (modulo_scalability.md §11) ─────────────────

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}

// Nomes em português dos domínios síncronos (o backend devolve-os em inglês).
const SYNC_DOMAIN_LABELS: Record<string, string> = {
  Processes: 'Processos',
  Payroll: 'Folha de pagamento',
  Reports: 'Relatórios',
  Imports: 'Importações',
  Exports: 'Exportações',
  'AI Tutor': 'Tutor de IA',
  'Avatar Training': 'Formação com avatar',
};

export function QueuesTab({ queues }: { queues: QueueMetricsData | null }) {
  if (!queues) {
    return (
      <EmptyState
        title="A carregar filas e tarefas"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const t = queues.totals;
  const points = queues.depthHistory.map((h, i) => ({
    x: i,
    y: h.total,
    xLabel: new Date(h.at).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Filas & Tarefas"
        sub="Filas Bull (Redis) e tarefas persistidas em base de dados"
      />
      {queues.mode === 'SYNC' && (
        <Card>
          <CardBody>
            <p className="font-body text-sm text-ink">
              As filas estão desligadas (QUEUE_ENABLED=false): a auditoria e as
              notificações executam de forma síncrona.
            </p>
          </CardBody>
        </Card>
      )}
      {queues.mode === 'QUEUE' && !queues.redisAvailable && (
        <Card>
          <CardBody>
            <p className="font-body text-sm text-danger">
              Redis indisponível — as filas Bull não responderam. Os valores
              abaixo incluem apenas as tarefas guardadas em base de dados.
            </p>
          </CardBody>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={ListChecks}
          tone="green"
          label="Tarefas executadas"
          value={fmt(t.executed)}
        />
        <NavyStatCard
          icon={Clock}
          tone="orange"
          label="Tarefas pendentes"
          value={fmt(t.pending)}
        />
        <NavyStatCard
          icon={Workflow}
          tone="blue"
          label="Tarefas em execução"
          value={fmt(t.running)}
        />
        <NavyStatCard
          icon={TriangleAlert}
          tone="red"
          label="Tarefas falhadas"
          value={fmt(t.failed)}
        />
        <NavyStatCard
          icon={Timer}
          tone="orange"
          label="Tarefas atrasadas"
          value={fmt(t.delayed)}
        />
        <NavyStatCard
          icon={Gauge}
          tone="blue"
          label="Tempo médio de execução"
          value={formatDuration(t.avgDurationMs)}
        />
        <NavyStatCard
          icon={Activity}
          tone="green"
          label="Throughput"
          value={t.throughputPerMin.toLocaleString()}
          sub="tarefas/min · filas Bull, últimos 5 min"
        />
        <NavyStatCard
          icon={Boxes}
          tone="blue"
          label="Tamanho da fila"
          value={fmt(t.queueSize)}
        />
        <NavyStatCard
          icon={RotateCcw}
          tone="orange"
          label="Novas tentativas"
          value={fmt(t.retries)}
          sub="tentativas além da primeira"
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Profundidade da fila</CardTitleBar>
        <CardBody>
          {points.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="A profundidade das filas é amostrada a cada minuto; o gráfico aparece após dois minutos de dados."
            />
          ) : (
            <AreaLineChart
              series={[{ label: 'Tarefas em espera', points }]}
              yFormat={(v) => `${v}`}
            />
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">
            Tarefas em espera + atrasadas nas filas Bull, últimas{' '}
            {queues.historyHours} h. O histórico é guardado em memória e
            reinicia com o servidor.
          </p>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardTitleBar>Por fila</CardTitleBar>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Fila</th>
                  <th className="py-1.5 text-right font-semibold">Em espera</th>
                  <th className="py-1.5 text-right font-semibold">
                    Em execução
                  </th>
                  <th className="py-1.5 text-right font-semibold">Atrasados</th>
                  <th className="py-1.5 text-right font-semibold">Falhados</th>
                  <th className="py-1.5 text-right font-semibold">
                    Concluídos
                  </th>
                  <th className="py-1.5 text-right font-semibold">
                    Duração média
                  </th>
                  <th className="py-1.5 text-right font-semibold">Jobs/min</th>
                  <th className="py-1.5 text-right font-semibold">Retries</th>
                </tr>
              </thead>
              <tbody>
                {queues.queues.map((q) => (
                  <tr key={q.key} className="border-t border-border">
                    <td className="py-1.5 text-ink">
                      {q.label}
                      <span className="ml-2 text-xs text-ink-faint">
                        {q.domain}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-ink">
                      {fmt(q.waiting)}
                    </td>
                    <td className="py-1.5 text-right text-ink">
                      {fmt(q.active)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(q.delayed)}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 text-right',
                        q.failed > 0
                          ? 'font-semibold text-danger'
                          : 'text-ink-muted',
                      )}
                    >
                      {fmt(q.failed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(q.completed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {formatDuration(q.avgDurationMs)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {q.throughputPerMin}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(q.retries)}
                    </td>
                  </tr>
                ))}
                {queues.queues.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-3 text-xs text-ink-faint">
                      Sem dados das filas Bull.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {queues.queues
            .filter((q) => q.lastFailure)
            .map((q) => (
              <p key={q.key} className="mt-2 font-body text-xs text-ink-faint">
                Última falha em {q.label}
                {q.lastFailure?.at
                  ? ` (${timeAgo(q.lastFailure.at)})`
                  : ''}: {q.lastFailure?.reason ?? 'sem motivo registado'}
              </p>
            ))}
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardTitleBar>Tarefas em base de dados (últimas 24 h)</CardTitleBar>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Origem</th>
                  <th className="py-1.5 text-right font-semibold">
                    Executados
                  </th>
                  <th className="py-1.5 text-right font-semibold">Pendentes</th>
                  <th className="py-1.5 text-right font-semibold">
                    Em execução
                  </th>
                  <th className="py-1.5 text-right font-semibold">Falhados</th>
                  <th className="py-1.5 text-right font-semibold">Atrasados</th>
                  <th className="py-1.5 text-right font-semibold">
                    Duração média
                  </th>
                  <th className="py-1.5 text-right font-semibold">Retries</th>
                </tr>
              </thead>
              <tbody>
                {queues.dbJobs.map((j) => (
                  <tr key={j.key} className="border-t border-border">
                    <td className="py-1.5 text-ink">{j.label}</td>
                    <td className="py-1.5 text-right text-ink">
                      {fmt(j.executed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(j.pending)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(j.running)}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 text-right',
                        j.failed > 0
                          ? 'font-semibold text-danger'
                          : 'text-ink-muted',
                      )}
                    >
                      {fmt(j.failed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(j.delayed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {formatDuration(j.avgDurationMs)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(j.retries)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-ink-faint">
            Sem fila nem registo de tarefas (executam de forma síncrona):{' '}
            {queues.synchronousDomains
              .map((d) => SYNC_DOMAIN_LABELS[d] ?? d)
              .join(', ')}
            .
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
