// components/dashboard-rh/CompliancePanel.tsx
// Painel "Compliance" — formações obrigatórias, nível de risco, actividade
// de auditoria e certificados recentes. Dados próprios (useApiQuery) +
// apresentação. Mesmo padrão de components/dashboard-rh/TrainingPanel.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import type { ComplianceData, DocumentsDashboardData } from './types';

const RISK_LABEL: Record<string, string> = {
  HIGH: 'Risco Alto',
  MEDIUM: 'Risco Médio',
  LOW: 'Risco Baixo',
};
const RISK_INTENT: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}

const RISK_PERCENT: Record<string, number> = {
  LOW: 30,
  MEDIUM: 65,
  HIGH: 100,
};

const RISK_HEX: Record<string, string> = {
  LOW: '#2E8B3E',
  MEDIUM: '#C9A227',
  HIGH: '#C0453F',
};

function ThermometerKpiCard({
  icon: Icon,
  label,
  value,
  risk,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  risk: string;
}) {
  const pct = RISK_PERCENT[risk] ?? 30;
  const color = RISK_HEX[risk] ?? '#2E8B3E';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-4 p-5 pt-6">
        <div className="relative flex h-20 w-6 shrink-0 flex-col items-center justify-end rounded-full bg-[#E3E8EF] p-1">
          <div
            className="w-full rounded-full transition-all"
            style={{ height: `${pct}%`, backgroundColor: color }}
          />
          <div
            className="absolute -bottom-1.5 h-5 w-5 rounded-full border-2 border-white"
            style={{ backgroundColor: color }}
          />
        </div>
        <div className="min-w-0">
          <Icon size={22} strokeWidth={1.75} style={{ color }} />
          <p className="mt-2 font-display text-2xl font-bold" style={{ color }}>
            {value}
          </p>
          <p className="mt-1 font-body text-sm font-medium text-ink-muted">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CompliancePanel() {
  const { data, isLoading: loading } = useApiQuery<ComplianceData>(
    queryKeys.dashboardRh.compliance(),
    '/dashboard-rh/compliance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const risk = data?.riskLevel ?? 'LOW';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3">
          <GaugeChart
            value={data?.mandatoryRate ?? 0}
            label={`Obrigatórias (${data?.mandatoryDone ?? 0}/${data?.mandatory ?? 0})`}
            thresholds={{ warning: 80, danger: 60 }}
            size={120}
          />
        </div>
        <ThermometerKpiCard
          icon={ShieldAlert}
          label="Nível de Risco"
          value={RISK_LABEL[risk]}
          risk={risk}
        />
        <TopBarKpiCard
          icon={ClipboardList}
          label="Eventos de Auditoria (mês)"
          value={data?.auditEvents ?? 0}
          tone="blue"
        />
      </div>

      {(data?.recentCerts ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Certificados Recentes (90 dias)
          </h4>
          <div className="space-y-2">
            {(data?.recentCerts ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">
                    {c.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {c.title ?? 'Certificado'} · {c.user?.department?.name}
                  </p>
                </div>
                <Badge intent="info" dot={false}>
                  {new Date(c.issuedAt).toLocaleDateString('pt-PT')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentos a expirar — contratos/certificações no repositório de
          documentos, até agora fora deste dashboard. */}
      <DocumentsExpiryWidget />
    </div>
  );
}

function DocumentsExpiryWidget() {
  const { data } = useApiQuery<DocumentsDashboardData>(
    queryKeys.dashboardRh.documentsDashboard(),
    '/documents/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  const k = data?.kpis;
  if (!k?.total) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <KpiCard
        label="Documentos a Expirar (30 dias)"
        value={k.expiringSoon ?? 0}
        intent="warning"
        className="w-full"
      />
      <KpiCard
        label="Documentos Expirados"
        value={k.expired ?? 0}
        intent="danger"
        className="w-full"
      />
      <KpiCard
        label="Documentos Activos"
        value={k.active ?? 0}
        intent="primary"
        className="w-full"
      />
    </div>
  );
}
