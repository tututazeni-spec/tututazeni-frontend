'use client';
// src/app/(dashboard)/dashboard/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix), o modal de
// pesquisa global e o badge de alertas urgentes no header; delega
// dados+apresentação de cada separador aos componentes auto-contidos em
// components/dashboard/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit e
// app/(platform)/leader/page.tsx (mesmo esqueleto header+Tabs, já
// migrado).

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Search,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import {
  ADMIN_ROLES,
  AUTHENTICATED_ROLES,
  filterByRole,
  MGMT_ROLES,
} from '@/lib/roles';
import { Button, IconButton } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ColaboradorDashboard } from '@/components/dashboard/ColaboradorDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';
import { Slideshow } from '@/components/dashboard/Slideshow';
import { ALERTS_POLL_MS, type Alert } from '@/components/dashboard/types';

// roles por separador alinhados com @Roles(...ALL_ROLES)/@Roles(...MGMT_ROLES)/
// @Roles(...ADMIN_ROLES) em src/dashboard/dashboard.controller.ts — os grupos
// vêm de lib/roles.ts (fonte única partilhada com o Sidebar), não alargar sem
// confirmar lá e no controller primeiro.
const TABS = [
  {
    id: 'personal',
    label: 'O Meu Dashboard',
    icon: LayoutDashboard,
    roles: AUTHENTICATED_ROLES,
  },
  {
    id: 'manager',
    label: 'Gestor',
    icon: Users,
    roles: MGMT_ROLES,
  },
  { id: 'org', label: 'Organização', icon: BarChart2, roles: ADMIN_ROLES },
];

export default function DashboardPage() {
  const [tab, setTab] = useState('personal');
  const [showSearch, setShowSearch] = useState(false);
  const role = useCurrentRole() ?? 'COLABORADOR';

  // Partilha a mesma key /dashboard/alerts dos sub-dashboards → 0 pedidos extra.
  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.dashboard.alerts(),
    '/dashboard/alerts',
    { refetchInterval: ALERTS_POLL_MS },
  );
  const alertCount = alerts.filter((x) => x.priority === 'URGENT').length;

  const availableTabs = filterByRole(TABS, role);

  return (
    <div className="min-h-screen bg-canvas">
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <p className="font-body text-sm text-ink-faint">
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setShowSearch(true)}
            >
              <Search size={14} strokeWidth={1.75} />
              Pesquisar
            </Button>
            <div className="relative">
              <IconButton icon={Bell} label="Notificações" intent="secondary" />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger font-body text-[9px] font-bold text-canvas">
                  {alertCount}
                </span>
              )}
            </div>
            <IconButton
              icon={RefreshCw}
              label="Actualizar"
              intent="secondary"
              onClick={() => window.location.reload()}
            />
          </div>
        </div>
      </div>

      {/* Slideshow — mesma posição de sempre: acima das tabs, visível em
          qualquer separador. */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Slideshow />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {availableTabs.map((t, i) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={
                    i < availableTabs.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="personal" className="pt-[0,10cm]!">
            <ColaboradorDashboard />
          </TabsContent>
          <TabsContent value="manager">
            <ManagerDashboard />
          </TabsContent>
          <TabsContent value="org">
            <OrgDashboard />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}