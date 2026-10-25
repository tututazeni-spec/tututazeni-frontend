'use client';

import { PeriodPills } from '@/components/ui/Pills';
import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import {
  Database,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react';
import { CardTitleBar } from '../InfraTabs';
import type { DatabaseMetricsData } from '../types';
import { GROWTH_TONES, GrowthCard, MetricTile, SectionHeader } from './shared';

// ─── BASE DE DADOS (modulo_scalability.md §8-9) ───────────────

const GROWTH_WINDOWS: Array<{
  key: '7d' | '30d' | '90d' | '1y';
  label: string;
}> = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: '1y', label: '1 ano' },
];

export function DatabaseTab({ db }: { db: DatabaseMetricsData | null }) {
  const [win, setWin] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  if (!db) {
    return (
      <EmptyState
        title="A carregar métricas da base de dados"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const rate = (v: number | null, unit: string) =>
    v === null ? '—' : `${v.toLocaleString()}${unit}`;
  const growthTile = (
    icon: typeof Users,
    tone: keyof typeof GROWTH_TONES,
    label: string,
    g: DatabaseMetricsData['growth']['daily'],
  ) => (
    <GrowthCard
      icon={icon}
      tone={tone}
      label={label}
      value={g ? `${g.growthGb >= 0 ? '+' : ''}${g.growthGb} GB` : '—'}
      caption={
        g ? `${g.coverageDays} dias de histórico` : 'a acumular histórico'
      }
    />
  );
  const series = db.growth.series[win];
  const f = db.growth.forecast;
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Base de Dados"
        sub="PostgreSQL — ligações, desempenho, índices e crescimento"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="CPU da BD" value="—" sub="não acessível por SQL" />
        <MetricTile label="RAM da BD" value="—" sub="não acessível por SQL" />
        <MetricTile
          label="Storage (tamanho da BD)"
          value={`${db.storage.sizeGb} GB`}
        />
        <MetricTile
          label="IOPS (leituras)"
          value={rate(db.throughput.readIops, '/s')}
          sub="blocos lidos do disco"
        />
        <MetricTile
          label="Throughput"
          value={rate(db.throughput.transactionsPerSecond, ' tx/s')}
        />
        <MetricTile
          label="Ligações activas"
          value={`${db.connections.active}`}
          sub={`${db.connections.total} abertas (${db.connections.idle} inactivas)`}
        />
        <MetricTile
          label="Ligações máximas"
          value={fmt(db.connections.max)}
          barValue={db.connections.usagePercent}
          barMax={100}
          barWarn={70}
          barDanger={90}
          sub={`${db.connections.usagePercent}% em uso`}
        />
        <MetricTile
          label="Pool de ligações"
          value={fmt(db.pool.max)}
          sub="DB_POOL_MAX por instância"
        />
        <MetricTile
          label="Queries por segundo"
          value={rate(db.throughput.queriesPerSecond, '/s')}
        />
        <MetricTile
          label="Queries lentas"
          value={fmt(db.queries.slowCount)}
          sub={`acima de ${db.queries.slowThresholdMs} ms (desde o arranque)`}
        />
        <MetricTile
          label="Locks em espera"
          value={fmt(db.health.waitingLocks)}
        />
        <MetricTile label="Deadlocks" value={fmt(db.health.deadlocks)} />
        <MetricTile
          label="Cache hit ratio"
          value={
            db.health.cacheHitRatio === null
              ? '—'
              : `${db.health.cacheHitRatio}%`
          }
        />
        <MetricTile
          label="Query média (app)"
          value={`${db.queries.appAvgMs} ms`}
          sub={`P95 ${db.queries.appP95Ms} ms · ${fmt(db.queries.appTotal)} queries`}
        />
        <MetricTile
          label="Índices"
          value={fmt(db.indexes.total)}
          sub={`${db.indexes.unusedCount} inutilizados (top 10)`}
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Queries lentas</CardTitleBar>
        <CardBody>
          {db.slowQueries === null ? (
            <EmptyState
              title="pg_stat_statements não está instalada"
              description="Activa a extensão pg_stat_statements no PostgreSQL para ver as queries mais lentas com execuções e tempo médio."
            />
          ) : db.slowQueries.rows.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem queries registadas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Query</th>
                    <th className="py-1.5 text-right font-semibold">
                      Execuções
                    </th>
                    <th className="py-1.5 text-right font-semibold">
                      Tempo médio
                    </th>
                    <th className="py-1.5 text-right font-semibold">Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {db.slowQueries.rows.map((q, i) => (
                    <tr key={i} className="border-t border-border">
                      <td
                        className="max-w-md truncate py-1.5 font-mono text-xs text-ink"
                        title={q.query}
                      >
                        {q.query}
                      </td>
                      <td className="py-1.5 text-right text-ink">
                        {fmt(q.calls)}
                      </td>
                      <td className="py-1.5 text-right text-ink">
                        {q.meanMs} ms
                      </td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {q.maxMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardTitleBar>Tabelas maiores</CardTitleBar>
          <CardBody>
            <table className="w-full font-body text-sm">
              <tbody>
                {db.largestTables.map((t) => (
                  <tr
                    key={t.name}
                    className="border-t border-border first:border-0"
                  >
                    <td className="py-1.5 font-mono text-xs text-ink">
                      {t.name}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {fmt(t.rows)} linhas
                    </td>
                    <td className="py-1.5 text-right text-ink">
                      {t.sizeMb} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <Card className="overflow-hidden">
          <CardTitleBar>Tabelas que mais crescem</CardTitleBar>
          <CardBody>
            {db.growth.growingTables.length === 0 ? (
              <p className="font-body text-xs text-ink-faint">
                A acumular histórico — aparece após duas ou mais amostras
                horárias com crescimento.
              </p>
            ) : (
              <table className="w-full font-body text-sm">
                <tbody>
                  {db.growth.growingTables.map((t) => (
                    <tr
                      key={t.name}
                      className="border-t border-border first:border-0"
                    >
                      <td className="py-1.5 font-mono text-xs text-ink">
                        {t.name}
                      </td>
                      <td className="py-1.5 text-right text-ink">
                        +{t.growthMb} MB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Índices inutilizados</CardTitleBar>
        <CardBody>
          {db.indexes.unused.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Nenhum índice sem leituras (excluindo únicos e chaves primárias).
            </p>
          ) : (
            <table className="w-full font-body text-sm">
              <tbody>
                {db.indexes.unused.map((i) => (
                  <tr
                    key={i.index}
                    className="border-t border-border first:border-0"
                  >
                    <td className="py-1.5 font-mono text-xs text-ink">
                      {i.index}
                    </td>
                    <td className="py-1.5 text-ink-muted">{i.table}</td>
                    <td className="py-1.5 text-right text-ink">
                      {i.sizeMb} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* §9 Crescimento da base de dados */}
      <div className="overflow-hidden rounded-card bg-gradient-to-br from-brand via-[#0B3A75] to-[#0A2A57] px-5 py-3 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="flex items-center gap-3">
          <Database
            className="h-6 w-6 shrink-0 text-[#7CC4FF]"
            strokeWidth={1.8}
            aria-hidden
          />
          <h2 className="font-display text-lg font-bold">
            Crescimento da base de dados
          </h2>
        </div>
        <p className="mt-1 font-body text-sm text-white/80">
          Database Growth — amostra horária do tamanho da BD
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {growthTile(TrendingUp, 'blue', 'Crescimento Diário', db.growth.daily)}
        {growthTile(
          CalendarDays,
          'green',
          'Crescimento Mensal',
          db.growth.monthly,
        )}
        {growthTile(BarChart3, 'purple', 'Crescimento Anual', db.growth.yearly)}
      </div>
      <Card>
        <CardBody>
          <PeriodPills
            className="mb-3"
            label="Janela de crescimento"
            options={GROWTH_WINDOWS.map((w) => ({
              value: w.key,
              label: w.label,
            }))}
            value={win}
            onChange={setWin}
          />
          {series.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="O tamanho da BD é amostrado a cada hora; o gráfico aparece com pelo menos dois dias de dados."
            />
          ) : (
            <AreaLineChart
              series={[
                {
                  label: 'Tamanho da BD (GB)',
                  points: series.map((s, i) => ({
                    x: i,
                    y: s.gb,
                    xLabel: s.day,
                  })),
                },
              ]}
              yFormat={(v) => `${v} GB`}
            />
          )}
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardTitleBar>Previsão</CardTitleBar>
        <CardBody>
          {f ? (
            <ul className="font-body text-sm text-ink">
              <li>Base de dados atual: {f.currentGb} GB</li>
              <li>Crescimento médio: {f.avgGrowthGbPerMonth} GB/mês</li>
              <li>Previsão 12 meses: {f.projectedGb12m} GB</li>
              <li className="mt-1 text-xs text-ink-faint">
                Calculado sobre {f.basedOnDays} dias de histórico.
              </li>
            </ul>
          ) : (
            <p className="font-body text-xs text-ink-faint">
              A acumular histórico — a previsão aparece após mais de um dia de
              amostras.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
