'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ThermometerStatCard } from '@/components/ui/charts/ThermometerStatCard';
import { INVERSE_RATE_BANDS } from '@/components/ui/charts/SpeedometerStatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardTitleBar } from '../InfraTabs';
import type { ApiMetricsData } from '../types';
import { MetricTile, SectionHeader } from './shared';

// ─── API & BACKEND (modulo_scalability.md §7) ──────────────────

const ENDPOINT_STATE: Record<
  ApiMetricsData['endpoints'][number]['status'],
  { label: string; intent: 'success' | 'warning' | 'danger' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

export function ApiTab({ api }: { api: ApiMetricsData | null }) {
  if (!api) {
    return (
      <EmptyState
        title="A carregar métricas da API"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const rate = (v: number | null, unit: string) =>
    v === null ? '—' : `${v.toLocaleString()}${unit}`;
  const warming = api.rates.requestsPerSecond === null;
  const uptimeMin = Math.round(api.sinceProcessStartSeconds / 60);
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="API e servidor"
        sub={`Capacidade da API NestJS — acumulado desde o arranque do servidor (${uptimeMin} min)`}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Pedidos por segundo"
          value={rate(api.rates.requestsPerSecond, '/s')}
          sub={
            warming
              ? 'a recolher amostras'
              : `janela de ${api.rates.windowSeconds / 60} min`
          }
        />
        <MetricTile
          label="Pedidos por minuto"
          value={rate(api.rates.requestsPerMinute, '/min')}
        />
        <MetricTile
          label="Total de requests"
          value={fmt(api.totals.requests)}
        />
        <MetricTile
          label="Throughput"
          value={rate(api.rates.throughputRps, ' req/s')}
          sub="sem contagem de bytes servidos"
        />
        <MetricTile
          label="Latência média"
          value={`${api.totals.avgLatencyMs} ms`}
        />
        <MetricTile label="P50" value={`${api.totals.p50Ms} ms`} />
        <MetricTile label="P95" value={`${api.totals.p95Ms} ms`} />
        <MetricTile label="P99" value={`${api.totals.p99Ms} ms`} />
        <ThermometerStatCard
          label="Taxa de erro"
          // escala 0–5% do erro mapeada para 0–100 do termómetro
          value={(api.totals.errorRate / 5) * 100}
          bands={INVERSE_RATE_BANDS}
          display={`${api.totals.errorRate}%`}
          caption="4xx + 5xx sobre o total"
        />
        <MetricTile label="HTTP 4xx" value={fmt(api.totals.http4xx)} />
        <MetricTile
          label="HTTP 5xx"
          value={fmt(api.totals.http5xx)}
          sub={
            api.rates.errors5xxPerMinute === null
              ? undefined
              : `${api.rates.errors5xxPerMinute}/min`
          }
        />
        <MetricTile
          label="Timeouts"
          value={fmt(api.totals.timeouts)}
          sub="respostas 408/504"
        />
        <MetricTile
          label="Pedidos concorrentes"
          value={
            api.concurrentRequests === null ? '—' : fmt(api.concurrentRequests)
          }
          sub={
            api.concurrentRequests === null
              ? 'pedidos em curso não são registados'
              : undefined
          }
        />
        <MetricTile
          label="Tempo de processamento"
          value={`${api.totals.avgProcessingMs} ms`}
          sub="média por pedido"
        />
        <MetricTile
          label="Pedidos lentos"
          value={fmt(api.totals.slowRequests)}
          sub={`acima de ${api.totals.slowThresholdMs} ms`}
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Por endpoint</CardTitleBar>
        <CardBody>
          {api.endpoints.length === 0 ? (
            <EmptyState
              title="Sem pedidos registados"
              description="Os endpoints aparecem à medida que a API recebe tráfego."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Endpoint</th>
                    <th className="py-1.5 text-right font-semibold">Pedidos</th>
                    <th className="py-1.5 text-right font-semibold">Média</th>
                    <th className="py-1.5 text-right font-semibold">P95</th>
                    <th className="py-1.5 text-right font-semibold">Erros</th>
                    <th className="py-1.5 text-right font-semibold">Lentos</th>
                    <th className="py-1.5 pl-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {api.endpoints.map((e) => {
                    const st = ENDPOINT_STATE[e.status];
                    return (
                      <tr key={e.endpoint} className="border-t border-border">
                        <td className="py-1.5 font-mono text-xs text-ink">
                          {e.endpoint}
                        </td>
                        <td className="py-1.5 text-right text-ink">
                          {fmt(e.requests)}
                        </td>
                        <td className="py-1.5 text-right text-ink-muted">
                          {e.avgMs} ms
                        </td>
                        <td className="py-1.5 text-right text-ink">
                          {e.p95Ms} ms
                        </td>
                        <td className="py-1.5 text-right text-ink-muted">
                          {e.errorRate}%
                        </td>
                        <td className="py-1.5 text-right text-ink-muted">
                          {fmt(e.slowRequests)}
                        </td>
                        <td className="py-1.5 pl-4">
                          <Badge intent={st.intent} dot={false}>
                            {st.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">
            Estado: Crítico com P95 &gt; 1,5 s ou ≥ 5% de erros 5xx; Atenção com
            P95 &gt; 500 ms ou ≥ 1% de erros 5xx.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
