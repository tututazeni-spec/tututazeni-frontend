// ============================================================
// INNOVA PLATFORM — SCALABILITY MODULE — CONTAINER
// src/pages/scalability/scalability.page.tsx
// ============================================================
//
// Container: guarda estado, decide quando actualizar e passa tudo por props
// à vista apresentacional (ScalabilityDashboardView) — sem lógica de render
// aqui. Extraído do ficheiro original (2020 linhas, container+apresentação
// juntos); os *Tab já estavam razoavelmente isolados, faltava só separar o
// topo. Ver memory project_innova_component_separation_audit, item 3.1.
//
// NOTA: ainda usa dados mock (MOCK_DASHBOARD/MOCK_ALERTS/...) — o módulo
// tem endpoints reais no backend (GET /scalability/dashboard/:tenantId,
// /scalability/integrations/tenant/:tenantId, /scalability/automations/
// tenant/:tenantId, /scalability/alerts), mas ligar isto requer primeiro
// resolver de onde vem o tenantId (a rota é multi-tenant — gestão de
// clientes da INNOVA, não o tenant do próprio utilizador — não há um
// "meu tenant" óbvio nos dados de sessão actuais) e confirmar que as DTOs
// do backend correspondem aos tipos aqui. Ficou fora de âmbito desta
// refactor (que é sobre separação de responsabilidades, não sobre ligar
// a API); a estrutura container/view já está pronta para isso — só a
// função `refresh` abaixo precisa de passar a fazer o fetch real.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScalabilityDashboardView } from '@/components/scalability/ScalabilityDashboardView';
import type {
  AutomationRule,
  Alert,
  DashboardData,
  Integration,
} from '@/components/scalability/types';

// ─── MOCK DATA (substituir por chamadas API) ──────────────────
const MOCK_DASHBOARD: DashboardData = {
  tenantInfo: {
    tenantName: 'Sonangol EP',
    plan: 'ENTERPRISE',
    maxUsers: 5000,
    activeUsersCount: 3847,
    storageUsedGb: 128,
    maxStorageGb: 500,
  },
  performanceSummary: {
    uptimePercent: 99.97,
    avgLatencyMs: 187,
    errorRate: 0.03,
    activeSessionsNow: 412,
    requestsPerMinute: 2840,
    cpuUsagePercent: 34,
    memoryUsagePercent: 61,
  },
  integrations: {
    total: 7,
    active: 5,
    withErrors: 1,
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
  },
  automations: { total: 18, active: 14, executionsToday: 234, failedToday: 3 },
  alerts: { open: 4, critical: 1, warning: 2, info: 1 },
  slaCompliance: {
    currentUptimePercent: 99.97,
    slaTarget: 99.9,
    isBreached: false,
    avgLatencyMs: 187,
    latencyTarget: 2000,
  },
};

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'CRITICAL',
    category: 'INTEGRATION',
    title: 'Falha na sincronização ERP',
    message:
      'Integração com ERP HR Angola falhou às 14:32. 0 registos processados.',
    isResolved: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '2',
    severity: 'WARNING',
    category: 'PERFORMANCE',
    title: 'CPU acima de 80%',
    message: 'Uso de CPU atingiu 82% durante pico de acessos simultâneos.',
    isResolved: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    severity: 'WARNING',
    category: 'STORAGE',
    title: 'Armazenamento em 76%',
    message: 'Uso de armazenamento atingiu 76% da capacidade contratada.',
    isResolved: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '4',
    severity: 'INFO',
    category: 'AUTOMATION',
    title: 'Automação de onboarding executada',
    message: '47 novos colaboradores processados via automação USER_HIRED.',
    isResolved: false,
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: '1',
    name: 'ERP RH Angola',
    type: 'ERP_HR',
    status: 'ERROR',
    syncFrequency: 'DAILY',
    lastSyncAt: new Date(Date.now() - 86400000).toISOString(),
    lastSyncStatus: 'FAILED',
  },
  {
    id: '2',
    name: 'Microsoft Teams',
    type: 'MICROSOFT_TEAMS',
    status: 'ACTIVE',
    syncFrequency: 'REALTIME',
    lastSyncAt: new Date(Date.now() - 300000).toISOString(),
    lastSyncStatus: 'SUCCESS',
  },
  {
    id: '3',
    name: 'Folha de Pagamento',
    type: 'PAYROLL',
    status: 'ACTIVE',
    syncFrequency: 'WEEKLY',
    lastSyncAt: new Date(Date.now() - 172800000).toISOString(),
    lastSyncStatus: 'SUCCESS',
  },
  {
    id: '4',
    name: 'SSO Microsoft',
    type: 'SSO_MICROSOFT',
    status: 'ACTIVE',
    syncFrequency: 'REALTIME',
    lastSyncAt: null,
    lastSyncStatus: null,
  },
  {
    id: '5',
    name: 'xAPI LRS',
    type: 'XAPI_LRS',
    status: 'ACTIVE',
    syncFrequency: 'REALTIME',
    lastSyncAt: new Date(Date.now() - 60000).toISOString(),
    lastSyncStatus: 'SUCCESS',
  },
];

const MOCK_AUTOMATIONS: AutomationRule[] = [
  {
    id: '1',
    name: 'Onboarding — Trilha Inicial',
    triggerType: 'USER_HIRED',
    isActive: true,
    runCount: 234,
    lastRunAt: new Date(Date.now() - 1800000).toISOString(),
    lastRunStatus: 'SUCCESS',
  },
  {
    id: '2',
    name: 'Promoção — Atualizar Trilha de Liderança',
    triggerType: 'USER_PROMOTED',
    isActive: true,
    runCount: 47,
    lastRunAt: new Date(Date.now() - 7200000).toISOString(),
    lastRunStatus: 'SUCCESS',
  },
  {
    id: '3',
    name: 'Recertificação Obrigatória',
    triggerType: 'CERTIFICATE_EXPIRED',
    isActive: true,
    runCount: 89,
    lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    lastRunStatus: 'FAILED',
  },
  {
    id: '4',
    name: 'Conclusão de Curso — Notificar Gestor',
    triggerType: 'COURSE_COMPLETED',
    isActive: true,
    runCount: 1203,
    lastRunAt: new Date(Date.now() - 300000).toISOString(),
    lastRunStatus: 'SUCCESS',
  },
  {
    id: '5',
    name: 'Offboarding — Revogar Acessos',
    triggerType: 'USER_OFFBOARDED',
    isActive: false,
    runCount: 12,
    lastRunAt: new Date(Date.now() - 604800000).toISOString(),
    lastRunStatus: 'SUCCESS',
  },
];

export default function ScalabilityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<DashboardData>(MOCK_DASHBOARD);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [integrations, setIntegrations] =
    useState<Integration[]>(MOCK_INTEGRATIONS);
  const [automations, setAutomations] =
    useState<AutomationRule[]>(MOCK_AUTOMATIONS);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    // Em produção: await fetch('/api/scalability/dashboard/{tenantId}')
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh a cada 60s
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <ScalabilityDashboardView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      dashboard={dashboard}
      alerts={alerts}
      integrations={integrations}
      automations={automations}
      lastRefresh={lastRefresh}
      onRefresh={refresh}
    />
  );
}
