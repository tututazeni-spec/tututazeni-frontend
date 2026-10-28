// components/scalability/ScalabilityDashboardView.tsx
// Casca (layout) do módulo de Escalabilidade: banner, separadores e o painel de
// cada aba. Sem estado de dados nem fetch — os painéis ligados vivem em
// ScalabilityPanels.tsx e as abas apresentacionais em ./tabs/ (uma por
// ficheiro; o que é partilhado entre elas está em ./tabs/shared.tsx).
//
// Migrado para a fundação de design light-theme (tokens canvas/surface/ink,
// componentes partilhados em components/ui/). Antes era um dashboard em tema
// escuro auto-contido (#080d19, header próprio, ícones glífo, cores neon) —
// documentado como exceção; essa exceção foi agora fechada. Cor reduzida ao
// mínimo semântico (estado danger/warning/success), números a preto. Os
// separadores levam um ícone lucide (padrão de components/evaluation360).

'use client';

import { type ReactNode } from 'react';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { Badge } from '@/components/ui/Badge';
import {
  Bell,
  Boxes,
  Database,
  FileText,
  Gauge,
  Globe,
  HardDrive,
  ListChecks,
  LayoutDashboard,
  LifeBuoy,
  KeyRound,
  LineChart,
  Siren,
  FlaskConical,
  Wallet,
  Plug,
  Scaling,
  Server,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import type { Alert } from './types';

// ─── TABS CONFIG ──────────────────────────────────────────

/** Aba só para o super administrador (ver LicensePanel). */
export const LICENSE_TAB: PillTabItem = {
  id: 'license',
  label: 'Licença',
  hint: 'Plano e validade',
  icon: KeyRound,
};

export const TABS: PillTabItem[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Estado geral',
    icon: LayoutDashboard,
  },
  {
    id: 'performance',
    label: 'Performance',
    hint: 'Latência e erros',
    icon: Gauge,
  },
  {
    id: 'integrations',
    label: 'Integrações',
    hint: 'Sistemas ligados',
    icon: Plug,
  },
  {
    id: 'automations',
    label: 'Automações',
    hint: 'Regras automáticas',
    icon: Workflow,
  },
  { id: 'alerts', label: 'Alertas', hint: 'Avisos abertos', icon: Bell },
  {
    id: 'sla',
    label: 'SLA & Compliance',
    hint: 'Objectivos de serviço',
    icon: ShieldCheck,
  },
  {
    id: 'users',
    label: 'Utilizadores',
    hint: 'Carga de utilizadores',
    icon: Users,
  },
  { id: 'api', label: 'API e servidor', hint: 'Pedidos e rotas', icon: Server },
  {
    id: 'database',
    label: 'Base de Dados',
    hint: 'Consultas e ligações',
    icon: Database,
  },
  {
    id: 'content',
    label: 'Conteúdo & CDN',
    hint: 'Entrega de conteúdo',
    icon: Globe,
  },
  {
    id: 'queues',
    label: 'Filas & Tarefas',
    hint: 'Tarefas em fila',
    icon: ListChecks,
  },
  {
    id: 'storage',
    label: 'Storage',
    hint: 'Espaço e ficheiros',
    icon: HardDrive,
  },
  {
    id: 'capacity',
    label: 'Capacidade',
    hint: 'Recursos disponíveis',
    icon: Boxes,
  },
  {
    id: 'autoscaling',
    label: 'Auto Scaling',
    hint: 'Escala automática',
    icon: Scaling,
  },
  {
    id: 'resilience',
    label: 'Resiliência',
    hint: 'Tolerância a falhas',
    icon: LifeBuoy,
  },
  { id: 'incidents', label: 'Incidentes', hint: 'Ocorrências', icon: Siren },
  {
    id: 'forecasts',
    label: 'Previsões',
    hint: 'Projecções de uso',
    icon: LineChart,
  },
  {
    id: 'loadtests',
    label: 'Testes de Carga',
    hint: 'Simulações de carga',
    icon: FlaskConical,
  },
  { id: 'costs', label: 'Custos', hint: 'Gastos de infra', icon: Wallet },
  {
    id: 'reports',
    label: 'Relatórios',
    hint: 'Relatórios técnicos',
    icon: FileText,
  },
  {
    id: 'settings',
    label: 'Configurações',
    hint: 'Limiares e opções',
    icon: Settings,
  },
];

// ─── CASCA DO DASHBOARD (layout + separadores; cada aba vem como painel) ───
//
// A casca só sabe de layout: banner, separadores e qual painel mostrar. Os
// painéis (ScalabilityPanels.tsx) vão buscar os seus próprios dados, por isso
// já não há props de dados aqui. Só montam quando a aba está activa.

export interface ScalabilityShellProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Conteúdo de cada aba, indexado pelo id em TABS. */
  panels: Record<string, ReactNode>;
  /** Abas a mostrar (omisso: TABS). Permite acrescentar abas restritas. */
  tabs?: PillTabItem[];
  alerts: Alert[];
  lastRefresh: Date;
}

export function ScalabilityShell({
  activeTab,
  onTabChange,
  panels,
  tabs = TABS,
  alerts,
  lastRefresh,
}: ScalabilityShellProps) {
  const openAlertCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter(
    (a) => !a.isResolved && a.severity === 'CRITICAL',
  ).length;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/escalabilidade.jpg"
          title="Escalabilidade"
          hint={`${
            criticalCount > 0
              ? `${criticalCount} alerta${criticalCount > 1 ? 's' : ''} crítico${criticalCount > 1 ? 's' : ''} · `
              : ''
          }Actualizado: ${lastRefresh.toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          })}`}
        />
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
          <PillTabsList
            items={tabs.map((tab) =>
              tab.id === 'alerts' && openAlertCount > 0
                ? {
                    ...tab,
                    badge: (
                      <Badge
                        intent={criticalCount > 0 ? 'danger' : 'warning'}
                        dot={false}
                        className="px-1.5 py-0"
                      >
                        {openAlertCount}
                      </Badge>
                    ),
                  }
                : tab,
            )}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {panels[tab.id]}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
