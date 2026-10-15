// components/audit/AccessView.tsx
// Aba 03 «Acessos e Sessões» (docs/modulo_audit.md §6). Dados reais:
//  - eventos: AuditLog (LOGIN, LOGOUT, FAILED, alterações de palavra-passe e de
//    funções/permissões);
//  - sessões activas: refresh tokens vivos dentro da janela de inactividade.
// Ainda não existem bloqueio de conta nem MFA na plataforma, por isso não são
// mostrados. Um login não prova que o utilizador esteve a trabalhar.

'use client';

import { PeriodPills } from '@/components/ui/Pills';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  AlertTriangle,
  KeyRound,
  LogIn,
  MonitorSmartphone,
  UserX,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { NavyHeroCard } from '@/components/ui/NavyHeroCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { BarChart } from '@/components/ui/charts/BarChart';
import { STATUS_CFG, actionLabel } from './constants';
import { EventDetailModal } from './EventDetailModal';
import { fmtTs } from './utils';
import type {
  AccessSummary,
  ActiveSession,
  AuditLog,
  Paginated,
} from './types';

const PERIODS = [7, 30, 90];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os eventos de acesso' },
  { value: 'LOGIN', label: 'Inícios de sessão' },
  { value: 'LOGOUT', label: 'Fins de sessão' },
  { value: 'FAILED', label: 'Tentativas falhadas' },
  { value: 'PASSWORD', label: 'Palavras-passe' },
  { value: 'PERMISSION', label: 'Funções e permissões' },
];

const ACTION_TEXT: Record<string, string> = {
  CHANGE_PASSWORD: 'Alteração de palavra-passe',
  PASSWORD_RESET: 'Reposição de palavra-passe',
  ROLE_ASSIGNED: 'Função atribuída',
  ROLE_CREATED: 'Função criada',
  ROLE_UPDATED: 'Função alterada',
  ROLE_DELETED: 'Função eliminada',
  ACCESS_DENIED: 'Acesso negado',
};

const label = (a: string) => ACTION_TEXT[a] ?? actionLabel(a);

const HEADER_BG = 'cursor-default select-none bg-[#0F1F3D]/60 text-white';
const PANEL_HEADER = `${HEADER_BG} px-4 py-3 font-body text-xs font-semibold`;

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={PANEL_HEADER}>{title}</div>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export function AccessView() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    ip: '',
    from: '',
    to: '',
  });
  const [openId, setOpenId] = useState<number | null>(null);

  const set = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const { data: summary } = useApiQuery<AccessSummary>(
    queryKeys.audit.accessSummary(days),
    '/audit/access/summary',
    { params: { days }, staleTime: STALE_TIME.DYNAMIC },
  );

  const eventParams = {
    type: filters.type,
    search: filters.search,
    ip: filters.ip,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00`).toISOString()
      : '',
    to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : '',
  };
  const { data: events, isLoading } = useApiQuery<Paginated<AuditLog>>(
    queryKeys.audit.accessEvents({ ...eventParams, page }),
    '/audit/access/events',
    {
      params: { ...eventParams, page, limit: 20 },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const { data: sessions } = useApiQuery<Paginated<ActiveSession>>(
    queryKeys.audit.accessSessions(sessionPage),
    '/audit/access/sessions',
    {
      params: { page: sessionPage, limit: 10 },
      staleTime: STALE_TIME.REALTIME,
      placeholderData: keepPreviousData,
    },
  );

  const t = summary?.totals;
  const dayLabel = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);

  return (
    <div className="space-y-5">
      <PeriodPills
        options={PERIODS.map((d) => ({ value: d, label: `${d} dias` }))}
        value={days}
        onChange={setDays}
      />

      {!summary || !t ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard
              icon={LogIn}
              label="Inícios de sessão"
              value={t.successLogins}
              sub={`Últimos ${summary.periodDays} dias`}
            />
            <KpiCard
              icon={UserX}
              label="Tentativas falhadas"
              value={t.failedLogins}
              intent="danger"
            />
            <KpiCard
              icon={MonitorSmartphone}
              label="Sessões activas"
              value={t.activeSessions}
              sub="Agora"
            />
            <KpiCard
              icon={KeyRound}
              label="Palavras-passe alteradas"
              value={t.passwordChanges}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Alterações de permissões"
              value={t.permissionChanges}
              intent="warning"
            />
          </div>

          {summary.alerts.length > 0 && (
            <div className="overflow-hidden rounded-card border border-warning bg-warning-subtle">
              <div className="border-b border-warning/30 px-4 py-2 font-body text-xs font-semibold text-warning-ink">
                Alertas de acesso a analisar
              </div>
              {summary.alerts.map((a, i) => (
                <div
                  key={i}
                  className="border-b border-warning/20 px-4 py-2 font-body text-xs text-ink last:border-0"
                >
                  {a.message}
                </div>
              ))}
              <p className="px-4 py-2 font-body text-xs text-ink-muted">
                Um alerta é um indício para análise, não prova de acesso
                indevido.
              </p>
            </div>
          )}

          <Panel title="Acessos por dia: bem-sucedidos vs. falhados">
            <BarChart
              categories={summary.daily.map((d) => dayLabel(d.date))}
              series={[
                {
                  label: 'Bem-sucedidos',
                  values: summary.daily.map((d) => d.success),
                },
                {
                  label: 'Falhados',
                  values: summary.daily.map((d) => d.failed),
                },
              ]}
              height={220}
            />
          </Panel>
        </>
      )}

      <Panel title="Sessões activas">
        {!sessions ? (
          <Skeleton rows={3} />
        ) : sessions.data.length === 0 ? (
          <p className="font-body text-xs text-ink-faint">
            Sem sessões activas.
          </p>
        ) : (
          <>
            {sessions.data.map((s) => (
              <div key={s.id} className="mb-3 last:mb-0">
                <NavyHeroCard
                  surfaceClassName="border-[#0A2342]/80 bg-[#0A2342]/80 p-2.5"
                  className="flex-wrap"
                >
                  <Avatar
                    name={s.user.fullName}
                    url={s.user.avatarUrl ?? undefined}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold tracking-tight text-white">
                      {s.user.fullName}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-white">
                      {s.user.email} · {s.user.role?.name ?? '—'}
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-body text-xs text-white">
                    Última actividade {fmtTs(s.lastActivity)}
                  </span>
                </NavyHeroCard>
              </div>
            ))}
            <Pagination
              page={sessionPage}
              totalPages={sessions.totalPages}
              onPageChange={setSessionPage}
              compact
            />
          </>
        )}
      </Panel>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            items={TYPE_ITEMS}
            value={filters.type || 'ALL'}
            onValueChange={(v) => set({ type: v === 'ALL' ? '' : v })}
            className="w-60"
          />
          <Input
            type="text"
            placeholder="Nome, e-mail ou ID"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-52"
          />
          <Input
            type="text"
            placeholder="IP"
            value={filters.ip}
            onChange={(e) => set({ ip: e.target.value })}
            className="w-36"
          />
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
            className="w-40"
          />
          <span className="ml-auto font-body text-xs text-ink-faint">
            {events?.total ?? 0} eventos
          </span>
        </div>

        {isLoading || !events ? (
          <Skeleton rows={8} />
        ) : (
          <>
            <Table>
              <TableHead className={HEADER_BG}>
                <TableRow className="hover:bg-transparent">
                  {[
                    'Data e hora',
                    'Utilizador',
                    'Evento',
                    'Resultado',
                    'IP',
                    'Navegador',
                  ].map((h) => (
                    <TableHeaderCell key={h} className="text-white">
                      {h}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {events.data.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setOpenId(e.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                      {fmtTs(e.timestamp)}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink">
                      {e.user?.fullName ?? (
                        <span className="italic text-ink-faint">
                          Conta desconhecida
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs font-medium text-ink">
                      {label(e.action)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge value={e.status} map={STATUS_CFG} />
                    </td>
                    <td className="px-3 py-2.5 font-data text-xs text-ink-faint">
                      {e.ip ?? '—'}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 font-body text-xs text-ink-faint">
                      {e.userAgent ?? '—'}
                    </td>
                  </tr>
                ))}
                {events.data.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                    >
                      Sem eventos de acesso para os filtros seleccionados
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={events.totalPages}
              onPageChange={setPage}
              compact
            />
          </>
        )}
      </div>

      <EventDetailModal
        eventId={openId}
        onClose={() => setOpenId(null)}
        onOpenEvent={setOpenId}
      />
    </div>
  );
}
