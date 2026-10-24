'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { CardTitleBar } from '../InfraTabs';
import type { StorageMetricsData } from '../types';
import { MetricTile, SectionHeader, timeAgo } from './shared';

// ─── STORAGE (modulo_scalability.md §12) ──────────────────────

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`;
}

function StorageBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: StorageMetricsData['byModule'];
}) {
  return (
    <Card className="overflow-hidden">
      <CardTitleBar>{title}</CardTitleBar>
      <CardBody>
        {rows.length === 0 ? (
          <p className="font-body text-xs text-ink-faint">
            Sem ficheiros registados.
          </p>
        ) : (
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-1.5 font-semibold">Nome</th>
                <th className="py-1.5 text-right font-semibold">Ficheiros</th>
                <th className="py-1.5 text-right font-semibold">Tamanho</th>
                <th className="py-1.5 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="py-1.5 text-ink">{r.label}</td>
                  <td className="py-1.5 text-right text-ink-muted">
                    {r.files.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right text-ink">
                    {formatSize(r.mb)}
                  </td>
                  <td className="py-1.5 text-right text-ink-muted">
                    {r.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

export function StorageTab({
  storage,
}: {
  storage: StorageMetricsData | null;
}) {
  if (!storage) {
    return (
      <EmptyState
        title="A carregar métricas de storage"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const growthPoints = storage.growth.map((g, i) => ({
    x: i,
    y: g.cumulativeGb,
    xLabel: g.month,
  }));
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Armazenamento"
        sub="Ficheiros guardados pela plataforma, por módulo, tipo e unidade"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricTile
          label="Storage total"
          value={storage.totalGb === null ? '—' : `${storage.totalGb} GB`}
          sub="quota do tenant"
        />
        <MetricTile
          label="Utilizado"
          value={formatSize(storage.usedMb)}
          barValue={storage.usagePercent ?? undefined}
          barMax={storage.usagePercent === null ? undefined : 100}
          barWarn={70}
          barDanger={90}
          sub={
            storage.usagePercent === null
              ? undefined
              : `${storage.usagePercent}% da quota`
          }
        />
        <MetricTile
          label="Disponível"
          value={
            storage.availableGb === null ? '—' : `${storage.availableGb} GB`
          }
        />
        <MetricTile
          headed
          label="Crescimento mensal"
          value={`${storage.monthlyGrowthMb >= 0 ? '+' : ''}${formatSize(storage.monthlyGrowthMb)}`}
          sub="carregado no último mês com dados"
        />
        <MetricTile
          label="Ficheiros armazenados"
          value={storage.files.toLocaleString()}
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Crescimento acumulado</CardTitleBar>
        <CardBody>
          {growthPoints.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="O gráfico aparece quando existirem ficheiros carregados em pelo menos dois meses."
            />
          ) : (
            <AreaLineChart
              series={[
                { label: 'Storage acumulado (GB)', points: growthPoints },
              ]}
              yFormat={(v) => `${v} GB`}
            />
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StorageBreakdown title="Storage por módulo" rows={storage.byModule} />
        <StorageBreakdown
          title="Categorias de conteúdo"
          rows={storage.byKind}
        />
        <StorageBreakdown title="Tipos de ficheiro" rows={storage.byType} />
        <StorageBreakdown title="Storage por unidade" rows={storage.byUnit} />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Maiores ficheiros</CardTitleBar>
        <CardBody>
          {storage.largestFiles.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem ficheiros com tamanho registado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Ficheiro</th>
                    <th className="py-1.5 font-semibold">Módulo</th>
                    <th className="py-1.5 font-semibold">Tipo</th>
                    <th className="py-1.5 text-right font-semibold">Tamanho</th>
                    <th className="py-1.5 text-right font-semibold">
                      Carregado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {storage.largestFiles.map((f, i) => (
                    <tr
                      key={`${f.name}-${i}`}
                      className="border-t border-border"
                    >
                      <td className="py-1.5 text-ink">{f.name}</td>
                      <td className="py-1.5 text-ink-muted">{f.module}</td>
                      <td className="py-1.5 text-ink-muted">{f.type}</td>
                      <td className="py-1.5 text-right text-ink">
                        {formatSize(f.mb)}
                      </td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {timeAgo(f.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">
            {storage.note}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
