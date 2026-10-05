// components/scalability/InfraTabs.tsx
// modulo_scalability.md §15-17 — abas Capacidade, Auto Scaling e Resiliência.
// Apresentacionais: dados e callbacks de gravação chegam por props do
// container (app/(platform)/scalability/page.tsx). Só ADMIN edita (canEdit).

'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type {
  AutoScalingData,
  AutoScalingUpdate,
  CapacityMetricsData,
  InfraLevel,
  ResilienceData,
  ResilienceUpdate,
  ScheduledScaling,
} from './types';

const LEVEL: Record<
  InfraLevel,
  { label: string; intent: 'success' | 'warning' | 'danger' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

const BAR_INTENT: Record<InfraLevel, 'success' | 'warning' | 'danger'> = {
  OK: 'success',
  ATENCAO: 'warning',
  CRITICO: 'danger',
};

function Header({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {sub && <p className="mt-1 font-body text-sm text-ink-muted">{sub}</p>}
    </div>
  );
}

function Tile({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardBody>
        <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">
          {value === null ? '—' : value}
          {value !== null && unit && (
            <span className="ml-1 text-sm font-normal text-ink-muted">
              {unit}
            </span>
          )}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </CardBody>
    </Card>
  );
}

function Note({ children }: { children: string }) {
  return <p className="font-body text-xs text-ink-faint">{children}</p>;
}

function fmt(n: number | null, digits = 1): string | null {
  if (n === null) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function ago(minutes: number | null): string {
  if (minutes === null) return 'nunca';
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  if (minutes < 1440) return `há ${Math.round(minutes / 60)} h`;
  return `há ${Math.round(minutes / 1440)} d`;
}

function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  if (minutes < 1440) {
    const h = minutes / 60;
    return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
  }
  const d = minutes / 1440;
  return `${Number.isInteger(d) ? d : d.toFixed(1)} d`;
}

function NumField({
  label,
  value,
  onChange,
  disabled,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1 font-body text-xs font-medium text-ink-muted">
      {label}
      <span className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={Number.isFinite(value) ? value : ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="w-28"
        />
        {suffix && <span className="text-ink-faint">{suffix}</span>}
      </span>
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

// ─── §15 Capacidade ────────────────────────────────────────

export interface CapacityTabProps {
  capacity: CapacityMetricsData | null;
  canEdit: boolean;
  saving?: boolean;
  onSaveLimits: (v: { maxConcurrentUsers: number; maxApiRps: number }) => void;
}

export function CapacityTab({
  capacity,
  canEdit,
  saving = false,
  onSaveLimits,
}: CapacityTabProps) {
  const [limits, setLimits] = useState<{
    maxConcurrentUsers: number;
    maxApiRps: number;
  } | null>(null);

  if (!capacity) {
    return (
      <EmptyState
        title="A carregar capacidade"
        description="Ainda não há dados de capacidade."
      />
    );
  }
  const c = capacity.current;
  const draft = limits ?? capacity.limits;
  const valid = draft.maxConcurrentUsers >= 1 && draft.maxApiRps >= 1;

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Capacidade actual"
        sub="Uso real da plataforma neste momento"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Utilizadores totais" value={fmt(c.totalUsers, 0)} />
        <Tile label="Utilizadores activos" value={fmt(c.activeUsers, 0)} />
        <Tile
          label="Concurrent users"
          value={fmt(c.concurrentUsers, 0)}
          sub={`pico 24h: ${fmt(c.concurrentPeak24h, 0)}`}
        />
        <Tile
          label="Requests/sec"
          value={fmt(c.requestsPerSecond)}
          unit="req/s"
        />
        <Tile label="Database connections" value={fmt(c.dbConnections, 0)} />
        <Tile label="Storage" value={fmt(c.storageGb)} unit="GB" />
        <Tile
          label="Queue throughput"
          value={fmt(c.queueThroughputPerMin)}
          unit="jobs/min"
        />
        <Tile
          label="Gargalo"
          value={capacity.bottleneck?.label ?? null}
          sub={
            capacity.bottleneck?.percent != null
              ? `${capacity.bottleneck.percent}% da capacidade`
              : undefined
          }
        />
      </div>

      <Header
        title="Capacidade máxima estimada"
        sub="Uso actual face à capacidade de cada recurso"
      />
      <Card>
        <CardBody>
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-1.5 font-semibold">Recurso</th>
                <th className="py-1.5 text-right font-semibold">Actual</th>
                <th className="py-1.5 text-right font-semibold">Capacidade</th>
                <th className="w-48 py-1.5 pl-4 font-semibold">Utilização</th>
              </tr>
            </thead>
            <tbody>
              {capacity.resources.map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="py-2 text-ink">
                    {r.label}
                    <span className="block text-[11px] text-ink-faint">
                      {r.source}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink-muted">
                    {fmt(r.current)} {r.unit}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink-muted">
                    {r.capacity === null ? '—' : `${fmt(r.capacity)} ${r.unit}`}
                  </td>
                  <td className="py-2 pl-4">
                    {r.percent === null || r.level === null ? (
                      <span className="text-ink-faint">sem dados</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={r.percent}
                          intent={BAR_INTENT[r.level]}
                        />
                        <span className="w-12 text-right tabular-nums text-ink">
                          {r.percent}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Limites definidos
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <NumField
              label="Concurrent users (máx.)"
              value={draft.maxConcurrentUsers}
              disabled={!canEdit}
              onChange={(v) => setLimits({ ...draft, maxConcurrentUsers: v })}
            />
            <NumField
              label="API RPS (máx.)"
              value={draft.maxApiRps}
              disabled={!canEdit}
              suffix="req/s"
              onChange={(v) => setLimits({ ...draft, maxApiRps: v })}
            />
            {canEdit && (
              <Button
                disabled={!limits || !valid || saving}
                onClick={() => limits && onSaveLimits(limits)}
              >
                Guardar limites
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      <Note>{capacity.note}</Note>
    </div>
  );
}

// ─── §16 Auto Scaling ──────────────────────────────────────

const DECISION: Record<
  AutoScalingData['evaluation']['decision'],
  { label: string; intent: 'success' | 'warning' | 'info' }
> = {
  HOLD: { label: 'Manter', intent: 'success' },
  SCALE_UP: { label: 'Adicionar instância', intent: 'warning' },
  SCALE_DOWN: { label: 'Remover instância', intent: 'info' },
};

export interface AutoScalingTabProps {
  data: AutoScalingData | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (v: AutoScalingUpdate) => void;
}

export function AutoScalingTab({
  data,
  canEdit,
  saving = false,
  onSave,
}: AutoScalingTabProps) {
  const [draft, setDraft] = useState<AutoScalingUpdate>({});

  if (!data) {
    return (
      <EmptyState
        title="A carregar auto scaling"
        description="Ainda não há política de auto scaling."
      />
    );
  }
  const p = { ...data.policy, ...draft };
  const e = data.evaluation;
  const dirty = Object.keys(draft).length > 0;
  const set = <K extends keyof AutoScalingUpdate>(
    k: K,
    v: AutoScalingUpdate[K],
  ) => setDraft((d) => ({ ...d, [k]: v }));

  const scheduled: ScheduledScaling[] = p.scheduled;
  const nums = [
    p.minInstances,
    p.maxInstances,
    p.targetCpu,
    p.targetMemory,
    p.requestsPerInstance,
    p.scaleUpThreshold,
    p.scaleUpMinutes,
    p.scaleDownThreshold,
    p.scaleDownMinutes,
    p.cooldownMinutes,
    p.emergencyMaxInstances,
  ];
  const error = nums.some((n) => !Number.isFinite(n))
    ? 'Preencha todos os valores numéricos.'
    : p.minInstances > p.maxInstances
      ? 'O mínimo de instâncias não pode exceder o máximo.'
      : p.scaleDownThreshold >= p.scaleUpThreshold
        ? 'O limiar de scale-down tem de ser inferior ao de scale-up.'
        : p.emergencyMaxInstances < p.maxInstances
          ? 'O máximo de emergência não pode ser inferior ao normal.'
          : scheduled.some(
                (s) =>
                  !s.name.trim() ||
                  !s.cron.trim() ||
                  s.minInstances > s.maxInstances,
              )
            ? 'Cada agendamento precisa de nome, cron e min ≤ max.'
            : null;

  const updateSchedule = (i: number, patch: Partial<ScheduledScaling>) =>
    set(
      'scheduled',
      scheduled.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Header
          title="Auto Scaling"
          sub="Política de escala e avaliação em tempo real"
        />
        <Badge intent={p.enabled ? 'success' : 'neutral'} dot>
          {p.enabled ? 'Activo' : 'Desactivado'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="CPU agora" value={fmt(e.cpuNow)} unit="%" />
        <Tile label="Memória agora" value={fmt(e.memoryNow)} unit="%" />
        <Tile
          label="Requests/sec"
          value={fmt(e.requestsPerSecond)}
          unit="req/s"
        />
        <Tile
          label="Instâncias recomendadas"
          value={e.recommendedInstances}
          sub={`entre ${p.minInstances} e ${p.maxInstances}`}
        />
      </div>
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-body text-sm text-ink-muted">
              Decisão das regras:
            </span>
            <Badge intent={DECISION[e.decision].intent} dot>
              {DECISION[e.decision].label}
            </Badge>
          </div>
          <ul className="mt-3 list-disc pl-5 font-body text-sm text-ink-muted">
            <li>
              CPU &gt; {p.scaleUpThreshold}% durante {p.scaleUpMinutes} min →
              adicionar instância
            </li>
            <li>
              CPU &lt; {p.scaleDownThreshold}% durante {p.scaleDownMinutes} min
              → remover instância
            </li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Configuração
          </p>
          <div className="mb-4">
            <Check
              label="Auto scaling activo"
              checked={p.enabled}
              disabled={!canEdit}
              onChange={(v) => set('enabled', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NumField
              label="Minimum instances"
              value={p.minInstances}
              disabled={!canEdit}
              onChange={(v) => set('minInstances', v)}
            />
            <NumField
              label="Maximum instances"
              value={p.maxInstances}
              disabled={!canEdit}
              onChange={(v) => set('maxInstances', v)}
            />
            <NumField
              label="Target CPU"
              value={p.targetCpu}
              suffix="%"
              disabled={!canEdit}
              onChange={(v) => set('targetCpu', v)}
            />
            <NumField
              label="Target memory"
              value={p.targetMemory}
              suffix="%"
              disabled={!canEdit}
              onChange={(v) => set('targetMemory', v)}
            />
            <NumField
              label="Requests per instance"
              value={p.requestsPerInstance}
              suffix="req/s"
              disabled={!canEdit}
              onChange={(v) => set('requestsPerInstance', v)}
            />
            <NumField
              label="Scale-up threshold"
              value={p.scaleUpThreshold}
              suffix="% CPU"
              disabled={!canEdit}
              onChange={(v) => set('scaleUpThreshold', v)}
            />
            <NumField
              label="Scale-up durante"
              value={p.scaleUpMinutes}
              suffix="min"
              disabled={!canEdit}
              onChange={(v) => set('scaleUpMinutes', v)}
            />
            <NumField
              label="Scale-down threshold"
              value={p.scaleDownThreshold}
              suffix="% CPU"
              disabled={!canEdit}
              onChange={(v) => set('scaleDownThreshold', v)}
            />
            <NumField
              label="Scale-down durante"
              value={p.scaleDownMinutes}
              suffix="min"
              disabled={!canEdit}
              onChange={(v) => set('scaleDownMinutes', v)}
            />
            <NumField
              label="Cooldown"
              value={p.cooldownMinutes}
              suffix="min"
              disabled={!canEdit}
              onChange={(v) => set('cooldownMinutes', v)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Scheduled scaling
            </p>
            {canEdit && (
              <Button
                intent="secondary"
                onClick={() =>
                  set('scheduled', [
                    ...scheduled,
                    {
                      name: '',
                      cron: '0 8 * * 1-5',
                      minInstances: p.minInstances,
                      maxInstances: p.maxInstances,
                    },
                  ])
                }
              >
                Adicionar agendamento
              </Button>
            )}
          </div>
          {scheduled.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem escalas agendadas.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {scheduled.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
                    Nome
                    <Input
                      value={s.name}
                      disabled={!canEdit}
                      onChange={(ev) =>
                        updateSchedule(i, { name: ev.target.value })
                      }
                      className="w-48"
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
                    Cron
                    <Input
                      value={s.cron}
                      disabled={!canEdit}
                      onChange={(ev) =>
                        updateSchedule(i, { cron: ev.target.value })
                      }
                      className="w-40 font-mono"
                    />
                  </label>
                  <NumField
                    label="Min"
                    value={s.minInstances}
                    disabled={!canEdit}
                    onChange={(v) => updateSchedule(i, { minInstances: v })}
                  />
                  <NumField
                    label="Max"
                    value={s.maxInstances}
                    disabled={!canEdit}
                    onChange={(v) => updateSchedule(i, { maxInstances: v })}
                  />
                  {canEdit && (
                    <Button
                      intent="secondary"
                      onClick={() =>
                        set(
                          'scheduled',
                          scheduled.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      Remover
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Emergency scaling
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <Check
              label="Permitir escala de emergência"
              checked={p.emergencyEnabled}
              disabled={!canEdit}
              onChange={(v) => set('emergencyEnabled', v)}
            />
            <NumField
              label="Máximo em emergência"
              value={p.emergencyMaxInstances}
              disabled={!canEdit}
              onChange={(v) => set('emergencyMaxInstances', v)}
            />
          </div>
        </CardBody>
      </Card>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!dirty || !!error || saving}
            onClick={() => onSave(draft)}
          >
            Guardar política
          </Button>
          {dirty && (
            <Button intent="secondary" onClick={() => setDraft({})}>
              Descartar
            </Button>
          )}
          {error && (
            <span className="font-body text-xs text-danger">{error}</span>
          )}
          <span className="font-body text-xs text-ink-faint">
            Alterações ficam registadas no Audit.
          </span>
        </div>
      )}
      <Note>{data.note}</Note>
    </div>
  );
}

// ─── §17 Resiliência ───────────────────────────────────────

export interface ResilienceTabProps {
  data: ResilienceData | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (v: ResilienceUpdate) => void;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ResilienceTab({
  data,
  canEdit,
  saving = false,
  onSave,
}: ResilienceTabProps) {
  const [draft, setDraft] = useState<ResilienceUpdate>({});

  if (!data) {
    return (
      <EmptyState
        title="A carregar resiliência"
        description="Ainda não há verificações de resiliência."
      />
    );
  }
  const i = data.indicators;
  const s = { ...data.settings, ...draft };
  const rpo = draft.rpoMinutes ?? i.rpoMinutes;
  const rto = draft.rtoMinutes ?? i.rtoMinutes;
  const dirty = Object.keys(draft).length > 0;
  const set = <K extends keyof ResilienceUpdate>(
    k: K,
    v: ResilienceUpdate[K],
  ) => setDraft((d) => ({ ...d, [k]: v }));
  const valid =
    Number.isFinite(rpo) &&
    rpo >= 1 &&
    Number.isFinite(rto) &&
    rto >= 1 &&
    Number.isFinite(s.apiReplicas) &&
    s.apiReplicas >= 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Header
          title="Resiliência"
          sub="Capacidade de continuar disponível quando um componente falha"
        />
        <Badge intent={LEVEL[data.overall].intent} dot>
          {LEVEL[data.overall].label} · {data.score}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="RPO"
          value={duration(i.rpoMinutes)}
          sub={
            i.rpoMet === null
              ? 'sem backup registado'
              : i.rpoMet
                ? 'objectivo cumprido'
                : 'objectivo EXCEDIDO'
          }
        />
        <Tile label="RTO" value={duration(i.rtoMinutes)} />
        <Tile label="Último backup" value={ago(i.lastBackupMinutesAgo)} />
        <Tile
          label="Último teste de recuperação"
          value={ago(i.lastRecoveryTestMinutesAgo)}
          sub={
            i.lastRecoveryTestOk === null
              ? undefined
              : i.lastRecoveryTestOk
                ? 'bem-sucedido'
                : 'falhou'
          }
        />
      </div>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Verificações
          </p>
          <table className="w-full font-body text-sm">
            <tbody>
              {data.checks.map((c) => (
                <tr key={c.key} className="border-t border-border">
                  <td className="py-2 text-ink">{c.label}</td>
                  <td className="py-2 text-ink-muted">{c.detail}</td>
                  <td className="py-2 text-right text-[11px] uppercase text-ink-faint">
                    {c.source === 'MEDIDO' ? 'medido' : 'declarado'}
                  </td>
                  <td className="py-2 text-right">
                    <Badge intent={LEVEL[c.status].intent} dot>
                      {LEVEL[c.status].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Objectivos e infraestrutura declarada
          </p>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <NumField
              label="RPO"
              value={rpo}
              suffix="min"
              disabled={!canEdit}
              onChange={(v) => set('rpoMinutes', v)}
            />
            <NumField
              label="RTO"
              value={rto}
              suffix="min"
              disabled={!canEdit}
              onChange={(v) => set('rtoMinutes', v)}
            />
            <NumField
              label="Réplicas da API"
              value={s.apiReplicas}
              disabled={!canEdit}
              onChange={(v) => set('apiReplicas', v)}
            />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Check
              label="Replicação da base de dados"
              checked={s.dbReplication}
              disabled={!canEdit}
              onChange={(v) => set('dbReplication', v)}
            />
            <Check
              label="Failover automático"
              checked={s.failoverEnabled}
              disabled={!canEdit}
              onChange={(v) => set('failoverEnabled', v)}
            />
            <Check
              label="Load balancer"
              checked={s.loadBalancer}
              disabled={!canEdit}
              onChange={(v) => set('loadBalancer', v)}
            />
            <Check
              label="CDN"
              checked={s.cdnEnabled}
              disabled={!canEdit}
              onChange={(v) => set('cdnEnabled', v)}
            />
            <Check
              label="Plano de disaster recovery documentado"
              checked={s.drPlanDocumented}
              disabled={!canEdit}
              onChange={(v) => set('drPlanDocumented', v)}
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 font-body text-xs font-medium text-ink-muted">
              Último backup
              <Input
                type="datetime-local"
                disabled={!canEdit}
                defaultValue={toLocalInput(i.lastBackupAt)}
                onChange={(e) =>
                  e.target.value &&
                  set('lastBackupAt', new Date(e.target.value).toISOString())
                }
              />
            </label>
            <label className="flex flex-col gap-1 font-body text-xs font-medium text-ink-muted">
              Último teste de recuperação
              <Input
                type="datetime-local"
                disabled={!canEdit}
                defaultValue={toLocalInput(i.lastRecoveryTestAt)}
                onChange={(e) =>
                  e.target.value &&
                  set(
                    'lastRecoveryTestAt',
                    new Date(e.target.value).toISOString(),
                  )
                }
              />
            </label>
            <Check
              label="Teste bem-sucedido"
              checked={
                draft.lastRecoveryTestOk ?? i.lastRecoveryTestOk ?? false
              }
              disabled={!canEdit}
              onChange={(v) => set('lastRecoveryTestOk', v)}
            />
          </div>
          {canEdit && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                disabled={!dirty || !valid || saving}
                onClick={() => onSave(draft)}
              >
                Guardar
              </Button>
              {dirty && (
                <Button intent="secondary" onClick={() => setDraft({})}>
                  Descartar
                </Button>
              )}
              <span className="font-body text-xs text-ink-faint">
                Alterações ficam registadas no Audit.
              </span>
            </div>
          )}
        </CardBody>
      </Card>
      <Note>{data.note}</Note>
    </div>
  );
}
