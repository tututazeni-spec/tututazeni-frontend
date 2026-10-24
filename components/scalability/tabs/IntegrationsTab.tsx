'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Activity,
  Database,
  Gauge,
  ListChecks,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  Plug,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { NewIntegrationModal } from '../NewIntegrationModal';
import type { IntegrationMetricsData, Integration } from '../types';
import { INTEGRATION_STATUS, SectionHeader, timeAgo } from './shared';

interface IntegrationsTabProps {
  tenantId: string;
  integrations: Integration[];
  metrics?: IntegrationMetricsData | null;
  onSync: (id: number) => void;
}

const INTEGRATION_ROW_STATE: Record<
  IntegrationMetricsData['integrations'][number]['state'],
  { label: string; intent: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
  INACTIVA: { label: 'Inactiva', intent: 'neutral' },
};

function IntegrationMetrics({ m }: { m: IntegrationMetricsData }) {
  const t = m.totals;
  const fmt = (n: number) => n.toLocaleString();
  const lat = (ms: number | null) =>
    ms === null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Indicadores"
        sub={`Sincronizações das últimas ${m.windowHours}h`}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={Plug}
          tone="green"
          label="Integrações activas"
          value={`${t.active}/${t.total}`}
        />
        <NavyStatCard
          icon={Activity}
          tone="blue"
          label="Pedidos"
          value={fmt(t.requests)}
          sub="execuções de sync"
        />
        <NavyStatCard
          icon={RefreshCw}
          tone="blue"
          label="Sincronizações"
          value={fmt(t.syncs)}
        />
        <NavyStatCard
          icon={TriangleAlert}
          tone="red"
          label="Falhas"
          value={fmt(t.failures)}
          sub={`${t.errorRate}% de erro`}
        />
        <NavyStatCard
          icon={Gauge}
          tone="orange"
          label="Latência média"
          value={lat(t.avgLatencyMs)}
        />
        <NavyStatCard
          icon={RotateCcw}
          tone="orange"
          label="Novas tentativas"
          value={fmt(t.retries)}
        />
        <NavyStatCard
          icon={ListChecks}
          tone="blue"
          label="Tarefas pendentes"
          value={fmt(t.pendingJobs)}
        />
        <NavyStatCard
          icon={Database}
          tone="green"
          label="Volume transferido"
          value={fmt(t.recordsTransferred)}
          sub="registos, sem contagem de bytes"
        />
      </div>
      <Card className="overflow-hidden">
        <h3 className="flex items-center bg-[#0F1F3D]/60 px-5 py-3 font-body text-sm font-semibold text-white">
          Por integração
        </h3>
        <CardBody>
          {m.integrations.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem integrações configuradas.
            </p>
          ) : (
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Integração</th>
                  <th className="py-1.5 text-right font-semibold">Pedidos</th>
                  <th className="py-1.5 text-right font-semibold">Erros</th>
                  <th className="py-1.5 text-right font-semibold">Latência</th>
                  <th className="py-1.5 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {m.integrations.map((r) => {
                  const s = INTEGRATION_ROW_STATE[r.state];
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-1.5 text-ink">{r.name}</td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {fmt(r.requests)}
                      </td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {r.errorRate}%
                      </td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {lat(r.latencyMs)}
                      </td>
                      <td className="py-1.5 text-right">
                        <Badge intent={s.intent} dot={s.intent !== 'neutral'}>
                          {s.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function IntegrationsTab({
  tenantId,
  integrations,
  metrics = null,
  onSync,
}: IntegrationsTabProps) {
  const notify = useToast();
  const [creating, setCreating] = useState(false);
  const typeLabels: Record<string, string> = {
    ERP_HR: 'ERP de RH',
    PAYROLL: 'Folha de Pagamento',
    ATS: 'ATS',
    MICROSOFT_TEAMS: 'Microsoft Teams',
    SLACK: 'Slack',
    SSO_GOOGLE: 'SSO Google',
    SSO_MICROSOFT: 'SSO Microsoft',
    SCORM_PROVIDER: 'SCORM',
    XAPI_LRS: 'xAPI / LRS',
    BI_TOOL: 'Ferramenta BI',
    CUSTOM_WEBHOOK: 'Webhook Custom',
    REST_API: 'API REST',
    SOAP_API: 'API SOAP',
    WEBHOOK: 'Webhook',
    SFTP: 'SFTP',
    OAUTH2: 'OAuth 2.0',
    LDAP: 'LDAP',
    SAML2: 'SAML 2.0',
    OPENID_CONNECT: 'OpenID Connect',
    DATABASE: 'Base de Dados',
    CSV_FILE: 'Ficheiro CSV',
    EXCEL_FILE: 'Ficheiro Excel',
    OTHER: 'Outro',
  };
  const freqLabel: Record<string, string> = {
    REALTIME: 'Tempo Real',
    HOURLY: 'A cada hora',
    DAILY: 'Diário',
    WEEKLY: 'Semanal',
    MANUAL: 'Manual',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Integrações Configuradas"
          sub="ERP, SSO, LMS padrões e comunicação"
        />
        <Button intent="secondary" size="sm" onClick={() => setCreating(true)}>
          Nova Integração
        </Button>
      </div>
      {creating && (
        <NewIntegrationModal
          tenantId={tenantId}
          onClose={() => setCreating(false)}
        />
      )}
      {metrics && <IntegrationMetrics m={metrics} />}
      <div className="flex flex-col gap-3">
        {integrations.map((int) => {
          const s = INTEGRATION_STATUS[int.status];
          return (
            <Card key={int.id}>
              <CardBody className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-semibold text-ink">
                    {int.name}
                  </p>
                  <p className="font-body text-xs text-ink-muted">
                    {typeLabels[int.type] ?? int.type} ·{' '}
                    {freqLabel[int.syncFrequency] ?? int.syncFrequency}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <Badge intent={s.intent} dot={s.intent !== 'neutral'}>
                    {s.label}
                  </Badge>
                  {int.lastSyncAt && (
                    <p className="mt-1 font-body text-[11px] text-ink-faint">
                      Sync: {timeAgo(int.lastSyncAt)} · {int.lastSyncStatus}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => onSync(int.id)}
                  >
                    Sync
                  </Button>
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() =>
                      notify({
                        title: `Configurar ${int.name}`,
                        intent: 'info',
                      })
                    }
                  >
                    Config
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {integrations.length === 0 && (
          <EmptyState
            title="Sem integrações configuradas"
            description="Adiciona uma integração (ERP, SSO, LMS…) para começar a sincronizar dados."
          />
        )}
      </div>
    </div>
  );
}
