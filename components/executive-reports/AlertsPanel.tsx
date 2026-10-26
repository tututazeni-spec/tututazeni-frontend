// components/executive-reports/AlertsPanel.tsx
// Alertas executivos (docs/Executive_Reports.md §9) no separador "Riscos &
// Alertas": descrição, gravidade, data, módulo de origem, responsável, prazo,
// estado, histórico e ligação ao registo de origem; regras com limiares
// configuráveis (aprovados por ADMIN/DIRECTOR).

'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Info,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { moduleLabel } from './kpiFormat';
import type {
  AlertEvent,
  AlertRule,
  AlertSeverity,
  AlertStatus,
  AlertsResponse,
  ExecutiveAlert,
} from './reportTypes';
import { safeHref } from '@/lib/safeHref';

const SEVERITY: Record<
  AlertSeverity,
  { label: string; intent: 'danger' | 'warning' | 'info' | 'neutral' }
> = {
  CRITICAL: { label: 'Crítico', intent: 'danger' },
  HIGH: { label: 'Alto', intent: 'danger' },
  MEDIUM: { label: 'Médio', intent: 'warning' },
  LOW: { label: 'Baixo', intent: 'info' },
};
const STATUS_LABEL: Record<AlertStatus, string> = {
  OPEN: 'Aberto',
  ACKNOWLEDGED: 'Reconhecido',
  RESOLVED: 'Resolvido',
  DISMISSED: 'Dispensado',
};
const ACTION_LABEL: Record<string, string> = {
  DETECTED: 'Detectado',
  ACKNOWLEDGED: 'Reconhecido',
  ASSIGNED: 'Atribuído',
  RESOLVED: 'Resolvido',
  DISMISSED: 'Dispensado',
  REOPENED: 'Reaberto',
  AUTO_RESOLVED: 'Resolvido automaticamente',
};
const STATUS_FILTERS: { value: '' | AlertStatus; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abertos' },
  { value: 'ACKNOWLEDGED', label: 'Reconhecidos' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'DISMISSED', label: 'Dispensados' },
];

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('pt-PT') : '—';
}

const HERO_RULE = 'TRAINING_TARGET_LATE';
const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  CRITICAL: '#F87171',
  HIGH: '#F87171',
  MEDIUM: '#FBBF24',
  LOW: '#7CC4FF',
};

// A % actual vem na descrição do alerta ("… em 0% (limiar …)").
function percentFromDescription(text: string) {
  const m = /\bem (\d+(?:[.,]\d+)?)\s*%/.exec(text);
  return m ? Number(m[1].replace(',', '.')) : 0;
}

function HeroRing({ percent, label }: { percent: number; label: string }) {
  const gid = useId();
  const size = 96;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7CC4FF" />
            <stop offset="100%" stopColor="#2F80ED" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold">
        {pct.toLocaleString('pt-PT')}%
      </span>
    </div>
  );
}

function AlertRow({ alert }: { alert: ExecutiveAlert }) {
  const notify = useToast();
  const role = useCurrentRole();
  const canManage = role === 'ADMIN' || role === 'RH' || role === 'DIRECTOR';
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');

  const detail = useApiQuery<{ events: AlertEvent[] }>(
    ['executive-reports', 'alert', alert.id],
    `/executive-reports/alerts/${alert.id}`,
    { enabled: open, staleTime: STALE_TIME.DYNAMIC },
  );
  const act = useApiMutation(
    (action: string) =>
      apiClient.post(`/executive-reports/alerts/${alert.id}/${action}`, {
        comment: comment.trim() || undefined,
      }),
    {
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: () => setComment(''),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const active = alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED';
  const sev = SEVERITY[alert.severity];

  const expandedBlock = open ? (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {alert.link && (
        <Link
          href={safeHref(alert.link) ?? '#'}
          className="inline-flex items-center gap-1 font-body text-xs text-primary hover:underline"
        >
          <ExternalLink size={12} /> Abrir registo de origem
        </Link>
      )}

      {active && (
        <div className="flex flex-wrap items-end gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentário (obrigatório para dispensar)"
            aria-label="Comentário"
            className="min-w-[20rem] flex-1"
          />
          {alert.status === 'OPEN' && (
            <Button
              size="sm"
              intent="secondary"
              disabled={act.isPending}
              onClick={() => act.mutate('acknowledge')}
            >
              Reconhecer
            </Button>
          )}
          <Button
            size="sm"
            intent="success"
            disabled={act.isPending}
            onClick={() => act.mutate('resolve')}
          >
            Resolver
          </Button>
          {canManage && (
            <Button
              size="sm"
              intent="ghost"
              disabled={act.isPending || comment.trim().length === 0}
              onClick={() => act.mutate('dismiss')}
            >
              Dispensar
            </Button>
          )}
        </div>
      )}
      {!active && canManage && (
        <Button
          size="sm"
          intent="secondary"
          disabled={act.isPending}
          onClick={() => act.mutate('reopen')}
        >
          Reabrir
        </Button>
      )}

      <div>
        <div className="mb-1 font-body text-xs font-medium text-ink">
          Histórico
        </div>
        {detail.isLoading && <Skeleton rows={3} />}
        <ul className="space-y-1">
          {(detail.data?.events ?? []).map((ev) => (
            <li key={ev.id} className="font-body text-xs text-ink-muted">
              {new Date(ev.createdAt).toLocaleString('pt-PT')} —{' '}
              {ACTION_LABEL[ev.action] ?? ev.action}
              {ev.user ? ` por ${ev.user.fullName}` : ''}
              {ev.comment ? `: ${ev.comment}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : null;

  if (alert.ruleCode === HERO_RULE) {
    const pct = percentFromDescription(alert.description);
    const color = SEVERITY_COLOR[alert.severity];
    return (
      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand-mid to-brand-dark p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="block w-full text-left"
          aria-expanded={open}
        >
          <div className="mb-2 flex items-center gap-3">
            <GraduationCap className="h-6 w-6" strokeWidth={1.8} aria-hidden />
            <h3 className="font-display text-base font-bold uppercase tracking-wide">
              {alert.title}
            </h3>
            {open ? (
              <ChevronDown size={18} className="ml-auto" />
            ) : (
              <ChevronRight size={18} className="ml-auto" />
            )}
          </div>
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
            <HeroRing
              percent={pct}
              label={`Taxa de conclusão de formação: ${pct}%`}
            />
            <div className="min-w-0 flex-1">
              <p className="mb-2 font-display text-xl font-bold leading-snug">
                Taxa de conclusão de formação
              </p>
              <div className="flex flex-wrap items-stretch gap-x-8 gap-y-2">
                <div>
                  <p className="font-body text-sm text-white/70">Gravidade</p>
                  <p
                    className="mt-1 flex items-center gap-2 font-display text-xl font-semibold"
                    style={{ color }}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {sev.label}
                  </p>
                </div>
                <div className="hidden w-px bg-white/20 sm:block" />
                <div>
                  <p className="font-body text-sm text-white/70">Estado</p>
                  <p className="font-display text-xl font-bold">
                    {STATUS_LABEL[alert.status]}
                  </p>
                </div>
                <div className="hidden w-px bg-white/20 sm:block" />
                <div>
                  <p className="font-body text-sm text-white/70">Prazo</p>
                  <p className="font-display text-xl font-bold">
                    {day(alert.dueDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
            <Info className="h-5 w-5 shrink-0 text-on-brand-accent" aria-hidden />
            <span>
              {alert.description} · Detectado em {day(alert.detectedAt)} ·
              Responsável: {alert.owner?.fullName ?? 'Por atribuir'}
            </span>
          </div>
        </button>
        {expandedBlock && (
          <div className="mt-3 rounded-card bg-surface p-3 text-ink">
            {expandedBlock}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={16} className="mt-1 text-ink-muted" />
        ) : (
          <ChevronRight size={16} className="mt-1 text-ink-muted" />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge intent={sev.intent}>{sev.label}</Badge>
            <span className="font-body text-sm font-semibold text-ink">
              {alert.title}
            </span>
            <Badge intent="neutral" dot={false}>
              {STATUS_LABEL[alert.status]}
            </Badge>
            {alert.overdue && (
              <Badge intent="danger" dot={false}>
                Prazo ultrapassado
              </Badge>
            )}
          </div>
          <p className="mt-1 font-body text-xs text-ink-muted">
            {alert.description}
          </p>
          <p className="mt-0.5 font-body text-xs text-ink-faint">
            Origem: {moduleLabel(alert.sourceModule)} · Detectado em{' '}
            {day(alert.detectedAt)} · Responsável:{' '}
            {alert.owner?.fullName ?? 'Por atribuir'} · Prazo:{' '}
            {day(alert.dueDate)}
          </p>
        </div>
      </button>

      {expandedBlock}
    </Card>
  );
}

function RuleThreshold({
  rule,
  canEdit,
}: {
  rule: AlertRule;
  canEdit: boolean;
}) {
  const notify = useToast();
  const [value, setValue] = useState(String(rule.threshold ?? ''));
  const save = useApiMutation(
    (body: { threshold?: number; active?: boolean }) =>
      apiClient.patch(`/executive-reports/alerts/rules/${rule.code}`, body),
    {
      invalidateKeys: [queryKeys.executiveReports.alertRules()],
      onSuccess: () =>
        notify({ title: 'Regra actualizada', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const parsed = Number(value);
  const dirty =
    value !== '' && Number.isFinite(parsed) && parsed !== rule.threshold;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3 font-body text-sm text-ink">
        {rule.name}
        <div className="font-body text-xs text-ink-faint">{rule.condition}</div>
      </td>
      <td className="py-2 pr-3 font-body text-xs text-ink-muted">
        {moduleLabel(rule.sourceModule)}
      </td>
      <td className="py-2 pr-3">
        {rule.available && rule.threshold !== null ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              value={value}
              disabled={!canEdit}
              onChange={(e) => setValue(e.target.value)}
              aria-label={`Limiar de ${rule.name}`}
              className="w-24"
            />
            <span className="font-body text-xs text-ink-faint">
              {rule.unit}
            </span>
            {canEdit && dirty && (
              <Button
                size="sm"
                loading={save.isPending}
                onClick={() => save.mutate({ threshold: parsed })}
              >
                Aprovar
              </Button>
            )}
          </div>
        ) : (
          <span className="font-body text-xs text-ink-faint">
            Sem fonte de dados
          </span>
        )}
      </td>
      <td className="py-2 font-body text-xs text-ink-muted">
        {rule.approvedAt
          ? `Aprovado em ${day(rule.approvedAt)}`
          : 'Valor por omissão'}
      </td>
      <td className="py-2">
        {rule.available && canEdit && (
          <Button
            size="sm"
            intent="ghost"
            onClick={() => save.mutate({ active: !rule.active })}
          >
            {rule.active ? 'Desactivar' : 'Activar'}
          </Button>
        )}
      </td>
    </tr>
  );
}

export function AlertsPanel() {
  const notify = useToast();
  const role = useCurrentRole();
  const isFull = role === 'ADMIN' || role === 'RH' || role === 'DIRECTOR';
  const canApprove = role === 'ADMIN' || role === 'DIRECTOR';
  const [status, setStatus] = useState<'' | AlertStatus>('OPEN');
  const params: Record<string, string | number> = { limit: 50 };
  if (status) params.status = status;

  const q = useApiQuery<AlertsResponse>(
    queryKeys.executiveReports.alerts(params),
    '/executive-reports/alerts',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const rulesQ = useApiQuery<AlertRule[]>(
    queryKeys.executiveReports.alertRules(),
    '/executive-reports/alerts/rules',
    { enabled: isFull, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const scan = useApiMutation(
    (_: void) =>
      apiClient.post<{ created: number; autoResolved: number }>(
        '/executive-reports/alerts/scan',
      ),
    {
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: (r) =>
        notify({
          title: `Avaliação concluída: ${r.created} novo(s), ${r.autoResolved} resolvido(s)`,
          intent: 'success',
        }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={2}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-20 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const bySeverity = q.data.summary.activeBySeverity;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">
            Alertas executivos
          </h2>
          {(Object.keys(SEVERITY) as AlertSeverity[]).map((s) =>
            bySeverity[s] ? (
              <Badge key={s} intent={SEVERITY[s].intent}>
                {SEVERITY[s].label}: {bySeverity[s]}
              </Badge>
            ) : null,
          )}
        </div>
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value || 'all'}
              size="sm"
              intent={status === f.value ? 'primary' : 'ghost'}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
          {isFull && (
            <Button
              size="sm"
              intent="secondary"
              loading={scan.isPending}
              onClick={() => scan.mutate()}
            >
              Avaliar agora
            </Button>
          )}
        </div>
      </div>

      {q.data.data.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sem alertas neste estado"
          description="As regras são avaliadas de 6 em 6 horas; use “Avaliar agora” para forçar a verificação."
        />
      ) : (
        <div className="space-y-3">
          {q.data.data.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </div>
      )}

      {isFull && rulesQ.data && (
        <Card className="overflow-hidden">
          <div className="bg-brand/60 px-4 py-3 font-body text-sm font-semibold text-white">
            Regras e limiares
          </div>
          <div className="p-4">
            <p className="mb-3 font-body text-xs text-ink-faint">
              Os limiares são configuráveis e só ADMIN/DIRECTOR os aprovam. A
              gravidade sobe para crítica quando o valor atinge o dobro do
              limiar.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border font-body text-xs text-ink-muted">
                    <th className="pb-2 pr-3 font-medium">Regra</th>
                    <th className="pb-2 pr-3 font-medium">Origem</th>
                    <th className="pb-2 pr-3 font-medium">Limiar</th>
                    <th className="pb-2 font-medium">Aprovação</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rulesQ.data.map((r) => (
                    <RuleThreshold key={r.code} rule={r} canEdit={canApprove} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}
