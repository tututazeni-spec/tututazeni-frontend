'use client';
// src/app/(dashboard)/dashboard/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega
// dados+apresentação de cada separador aos componentes auto-contidos em
// components/dashboard/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit e
// app/(platform)/leader/page.tsx (mesmo esqueleto header+Tabs, já
// migrado).

import { useState } from 'react';
import { LayoutDashboard, Users, BarChart2 } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import {
  AUTHENTICATED_ROLES,
  EXECUTIVE_ROLES,
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
// confirmar lá e no controller primeiro. O separador "org" ("Executivo")
// corresponde a Role.ADMIN/RH/GESTOR em
// src/dashboard-institutional/dashboard-institutional.controller.ts#getExecutive
// — antiga página /dashboard/institutional, consolidada aqui (ver OrgDashboard.tsx).
const TABS = [
  {
    id: 'personal',
    label: 'O Meu Dashboard',
    hint: 'Resumo pessoal',
    icon: LayoutDashboard,
    roles: AUTHENTICATED_ROLES,
  },
  {
    id: 'manager',
    label: 'Gestor',
    hint: 'Equipa e desempenho',
    icon: Users,
    roles: MGMT_ROLES,
  },
  {
    id: 'org',
    label: 'Executivo',
    hint: 'Visão estratégica',
    icon: BarChart2,
    roles: EXECUTIVE_ROLES,
  },
];

export default function DashboardPage() {
  const [tab, setTab] = useState('personal');
  const role = useCurrentRole() ?? 'COLABORADOR';

  const availableTabs = filterByRole(TABS, role);

  const activeTab =
  availableTabs.find((item) => item.id === tab) ?? availableTabs[0];

const ActiveIcon = activeTab?.icon;

  return (
    <div className="min-h-screen bg-canvas">
            {/* Header dinâmico */}
      <div className="border-b border-border bg-canvas px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {ActiveIcon && (
              <ActiveIcon
                size={22}
                strokeWidth={1.8}
                className="transition-all duration-300"
              />
            )}
          </div>

          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Dashboard 
            </h1>
            {activeTab?.hint && (
              <p className="mt-0.5 font-body text-xs text-ink-muted">
                {activeTab.hint}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Slideshow — mesma posição de sempre: acima das tabs, visível em
          qualquer separador. */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Slideshow />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        {/* Abas em formato de "cartão": cada trigger é um cartão
            independente (borda + fundo branco + rounded), sem underline
            no container. Estado activo usa data-[state=active] do Radix
            para aplicar destaque azul (borda/fundo/texto primary). */}
        <div className="bg-canvas px-6">
          <TabsList className="mx-auto flex max-w-7xl gap-2 overflow-x-auto bg-transparent p-0">
            {availableTabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="gap-2 whitespace-nowrap rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-none
                             data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="personal">
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