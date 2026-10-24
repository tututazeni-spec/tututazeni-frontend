'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import {
  Activity,
  Boxes,
  Gauge,
  Globe,
  LineChart,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Scaling,
  Server,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { ImportUsersModal } from '../ImportUsersModal';
import { CardTitleBar } from '../InfraTabs';
import type {
  DashboardData,
  UsersLoadData,
  UsersLoadSegmentRow,
} from '../types';
import { GrowthCard, SectionHeader } from './shared';

interface UsersTabProps {
  data: DashboardData;
  load: UsersLoadData | null;
}

const SEGMENT_TABS: Array<{
  key: keyof Omit<UsersLoadData['segmentation'], 'platform'>;
  label: string;
}> = [
  { key: 'unit', label: 'Unidade' },
  { key: 'department', label: 'Departamento' },
  { key: 'position', label: 'Cargo' },
  { key: 'role', label: 'Perfil' },
  { key: 'location', label: 'Localização' },
  { key: 'userType', label: 'Tipo de utilizador' },
];

function SegmentTable({ rows }: { rows: UsersLoadSegmentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="font-body text-xs text-ink-faint">
        Sem dados para esta segmentação.
      </p>
    );
  }
  return (
    <table className="w-full font-body text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
          <th className="py-1.5 font-semibold">Segmento</th>
          <th className="py-1.5 text-right font-semibold">Utilizadores</th>
          <th className="py-1.5 text-right font-semibold">Activos (30d)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t border-border">
            <td className="py-1.5 text-ink">{r.name}</td>
            <td className="py-1.5 text-right text-ink">
              {r.users.toLocaleString()}
            </td>
            <td className="py-1.5 text-right text-ink-muted">
              {r.activeMonthly.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function UsersTab({ data, load }: UsersTabProps) {
  const { tenantInfo: t } = data;
  const [importing, setImporting] = useState(false);
  const [segment, setSegment] =
    useState<(typeof SEGMENT_TABS)[number]['key']>('department');
  const fmt = (n: number) => n.toLocaleString();
  const growthSub = (g: { newUsers: number; percent: number }) =>
    `${g.newUsers.toLocaleString()} novos (${g.percent}% da base)`;
  const hhmm = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Utilizadores & Carga"
          sub="Impacto do crescimento de utilizadores, segmentação e gestão de licenças"
        />
        <Button intent="secondary" size="sm" onClick={() => setImporting(true)}>
          Importar CSV
        </Button>
      </div>

      {importing && (
        <ImportUsersModal tenantId={t.id} onClose={() => setImporting(false)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Utilizadores Activos"
          value={t.activeUsersCount.toLocaleString()}
          sub={`de ${t.maxUsers.toLocaleString()} licenças`}
        />
        <NavyStatCard
          icon={Boxes}
          tone="green"
          label="Licenças Disponíveis"
          value={(t.maxUsers - t.activeUsersCount).toLocaleString()}
        />
        <NavyStatCard
          icon={Scaling}
          tone="orange"
          label="Plano Actual"
          value={t.plan}
        />
      </div>

      {!load ? (
        <EmptyState
          title="A carregar indicadores de carga"
          description="Os indicadores de utilizadores aparecem aqui assim que estiverem disponíveis."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NavyStatCard
              icon={Users}
              tone="blue"
              label="Total de utilizadores"
              value={fmt(load.totals.total)}
            />
            <NavyStatCard
              icon={ShieldCheck}
              tone="green"
              label="Utilizadores activos"
              value={fmt(load.totals.active)}
            />
            <NavyStatCard
              icon={Activity}
              tone="blue"
              label="Activos diariamente"
              value={fmt(load.totals.activeDaily)}
              sub="com sessão nas últimas 24h"
            />
            <NavyStatCard
              icon={Activity}
              tone="green"
              label="Activos mensalmente"
              value={fmt(load.totals.activeMonthly)}
              sub="com sessão nos últimos 30 dias"
            />
            <NavyStatCard
              icon={Globe}
              tone="orange"
              label="Simultâneos agora"
              value={fmt(load.concurrent.current)}
            />
            <NavyStatCard
              icon={LineChart}
              tone="red"
              label="Pico de simultâneos"
              value={fmt(load.concurrent.peak24h)}
              sub={`histórico: ${fmt(load.concurrent.historicPeak)}`}
            />
            <NavyStatCard
              icon={Workflow}
              tone="blue"
              label="Média de sessões"
              value={load.sessions.avgPerUser30d.toLocaleString()}
              sub="logins por utilizador activo / 30d"
            />
            <NavyStatCard
              icon={Gauge}
              tone="orange"
              label="Duração média da sessão"
              value={
                load.sessions.avgDurationMinutes === null
                  ? '—'
                  : `${load.sessions.avgDurationMinutes} min`
              }
              sub={
                load.sessions.avgDurationMinutes === null
                  ? 'o fim das sessões não é registado'
                  : undefined
              }
            />
            <NavyStatCard
              icon={Server}
              tone="green"
              label="Pedidos por utilizador"
              value={
                load.sessions.requestsPerUserPerMin === null
                  ? '—'
                  : `${load.sessions.requestsPerUserPerMin}/min`
              }
              sub={
                load.sessions.requestsPerUserPerMin === null
                  ? 'aguarda o módulo Monitoring'
                  : undefined
              }
            />
            <GrowthCard
              icon={TrendingUp}
              tone="blue"
              label="Crescimento Diário"
              value={`+${load.growth.daily.percent}%`}
              chip={`+${load.growth.daily.newUsers.toLocaleString()} novos`}
              caption="da base de utilizadores, hoje"
            />
            <GrowthCard
              icon={CalendarDays}
              tone="green"
              label="Crescimento Mensal"
              value={`+${load.growth.monthly.percent}%`}
              chip={`+${load.growth.monthly.newUsers.toLocaleString()} novos`}
              caption="da base de utilizadores, este mês"
            />
            <GrowthCard
              icon={BarChart3}
              tone="purple"
              label="Crescimento Anual"
              value={`+${load.growth.yearly.percent}%`}
              chip={`+${load.growth.yearly.newUsers.toLocaleString()} novos`}
              caption="da base de utilizadores, este ano"
            />
          </div>

          <Card>
            <CardBody>
              <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Utilizadores simultÃ¢neos (24h)
              </p>
              <p className="mb-3 font-body text-xs text-ink-faint">
                Média {load.concurrent.avg24h} · Máximo {load.concurrent.max24h}{' '}
                · Mínimo {load.concurrent.min24h} · Pico histórico{' '}
                {load.concurrent.historicPeak}
              </p>
              {load.concurrent.timeline.length === 0 ? (
                <EmptyState
                  title="Sem métricas nas últimas 24 horas"
                  description="O histórico é preenchido automaticamente a cada minuto."
                />
              ) : (
                <AreaLineChart
                  series={[
                    {
                      label: 'Simultâneos (pico por hora)',
                      points: load.concurrent.timeline.map((m, i) => ({
                        x: i,
                        y: m.peak,
                        xLabel: hhmm(m.at),
                      })),
                    },
                    {
                      label: 'Média 24h',
                      points: load.concurrent.timeline.map((m, i) => ({
                        x: i,
                        y: load.concurrent.avg24h,
                        xLabel: hhmm(m.at),
                      })),
                    },
                  ]}
                />
              )}
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardTitleBar>Segmentação</CardTitleBar>
            <CardBody>
              <div className="mb-4 flex flex-wrap gap-2">
                {SEGMENT_TABS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSegment(s.key)}
                    className={`rounded-pill px-3 py-1 font-body text-xs font-medium ${
                      segment === s.key
                        ? 'bg-ink text-surface'
                        : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <span
                  className="rounded-pill bg-surface-sunken px-3 py-1 font-body text-xs font-medium text-ink-faint"
                  title="Não há registo de dispositivo (web/mobile) nas sessões."
                >
                  Web/mobile: sem dados
                </span>
              </div>
              <SegmentTable rows={load.segmentation[segment]} />
            </CardBody>
          </Card>
        </>
      )}

      {/* Role grid */}
      <Card className="overflow-hidden">
        <CardTitleBar>Perfis de Acesso (RBAC)</CardTitleBar>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                role: 'Admin',
                color: '#EF4657',
                desc: 'Acesso total à plataforma',
              },
              {
                role: 'RH',
                color: '#1877F2',
                desc: 'Gestão de utilizadores e relatórios',
              },
              {
                role: 'Gestor',
                color: '#E99A16',
                desc: 'Equipa e relatórios de departamento',
              },
              {
                role: 'Instrutor',
                color: '#7C3AED',
                desc: 'Criação e gestão de conteúdo',
              },
              {
                role: 'Colaborador',
                color: '#218653',
                desc: 'Acesso a cursos e trilhas',
              },
              {
                role: 'Auditor',
                color: '#0F766E',
                desc: 'Leitura de logs e compliance',
              },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-card border border-border border-l-4 bg-surface p-3"
                style={{ borderLeftColor: r.color }}
              >
                <p className="font-body text-sm font-semibold text-ink">
                  {r.role}
                </p>
                <p className="mt-0.5 font-body text-xs text-ink-faint">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
