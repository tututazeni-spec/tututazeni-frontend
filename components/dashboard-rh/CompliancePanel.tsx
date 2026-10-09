// components/dashboard-rh/CompliancePanel.tsx
// Painel "Compliance" — formações obrigatórias, nível de risco, actividade
// de auditoria e certificados recentes. Dados próprios (useApiQuery) +
// apresentação. Mesmo padrão de components/dashboard-rh/TrainingPanel.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';
import { rateTone } from './rateTone';
import {
  ClipboardList,
  FileCheck,
  FileClock,
  FileX,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { ComplianceData, DocumentsDashboardData } from './types';

const RISK_LABEL: Record<string, string> = {
  HIGH: 'Risco Alto',
  MEDIUM: 'Risco Médio',
  LOW: 'Risco Baixo',
};
const RISK_TONE: Record<string, NavyStatTone> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'green',
};
const RISK_INTENT: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};



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
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  const risk = data?.riskLevel ?? 'LOW';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          icon={ShieldCheck}
          tone={rateTone(data?.mandatoryRate ?? 0, { warning: 80, danger: 60 })}
          label={`Obrigatórias (${data?.mandatoryDone ?? 0}/${data?.mandatory ?? 0})`}
          value={`${Math.round(data?.mandatoryRate ?? 0)}%`}
        />
        <NavyStatCard
          icon={ShieldAlert}
          label="Nível de Risco"
          value={RISK_LABEL[risk]}
          tone={RISK_TONE[risk] ?? 'green'}
        />
        <NavyStatCard
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
      <NavyStatCard
        icon={FileClock}
        label="Documentos a Expirar (30 dias)"
        value={k.expiringSoon ?? 0}
        tone="orange"
      />
      <NavyStatCard
        icon={FileX}
        label="Documentos Expirados"
        value={k.expired ?? 0}
        tone="red"
      />
      <NavyStatCard
        icon={FileCheck}
        label="Documentos Activos"
        value={k.active ?? 0}
        tone="blue"
      />
    </div>
  );
}
