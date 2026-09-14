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
        <KpiCard
          label="Formações Obrigatórias Concluídas"
          value={`${data?.mandatoryRate ?? 0}%`}
          sub={`${data?.mandatoryDone ?? 0} de ${data?.mandatory ?? 0}`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Nível de Risco"
          value={RISK_LABEL[risk]}
          intent={RISK_INTENT[risk]}
          className="w-full"
        />
        <KpiCard
          label="Eventos de Auditoria (mês)"
          value={data?.auditEvents ?? 0}
          intent="info"
          className="w-full"
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
