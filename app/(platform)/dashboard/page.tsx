'use client';
// src/app/(dashboard)/dashboard/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); o sino de
// notificações vive só no Topbar (evitar duplicação) e o header de
// pesquisa/actualizar foi removido (idem, redundante com o Topbar) — o
// banner ocupa agora o espaço libertado no topo. Delega dados+apresentação
// de cada separador aos componentes auto-contidos em
// components/dashboard/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit e
// app/(platform)/leader/page.tsx (mesmo esqueleto header+Tabs, já
// migrado).

import { useState } from 'react';
import { LayoutDashboard, Users, BarChart2 } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import {
  ADMIN_ROLES,
  AUTHENTICATED_ROLES,
  filterByRole,
  MGMT_ROLES,
} from '@/lib/roles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ColaboradorDashboard } from '@/components/dashboard/ColaboradorDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { Slideshow } from '@/components/dashboard/Slideshow';

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
  const role = useCurrentRole() ?? 'COLABORADOR';

  const availableTabs = filterByRole(TABS, role);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Slideshow — topo da página, acima das tabs, visível em qualquer
          separador; ocupa agora o espaço do antigo header
          pesquisar/actualizar. */}
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <h1 className="mb-4 font-display text-xl font-bold text-ink">
          Dashboard
        </h1>
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