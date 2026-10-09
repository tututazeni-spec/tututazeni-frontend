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
import { BarChart2, CircleCheck, LayoutDashboard, Users } from 'lucide-react';
import { DashboardWatermark } from '@/components/dashboard/DashboardWatermark';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
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

  // Nome do tenant definido em Definições → Visão Geral (aberto a qualquer
  // utilizador autenticado, ao contrário de /settings/organization).
  const { data: branding } = useApiQuery<{ tenantName?: string }>(
    queryKeys.settings.branding(),
    '/settings/branding',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const tenantName = branding?.tenantName?.trim();

  const availableTabs = filterByRole(TABS, role);

  const activeTab =
    availableTabs.find((item) => item.id === tab) ?? availableTabs[0];

  const ActiveIcon = activeTab?.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Container azul: cabeçalho dinâmico + Slideshow no mesmo cartão
          (#0F1F3D), acima das tabs e visível em qualquer separador. */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        {tenantName && (
          <p className="mb-3 truncate font-display text-lg font-bold text-[#0F1F3D]">
            {tenantName}
          </p>
        )}
        <section className="overflow-hidden rounded-3xl bg-[#0F1F3D] text-white shadow-[0_12px_32px_rgba(15,31,61,0.25)]">
          <div className="flex items-center gap-3 px-6 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
              {ActiveIcon && (
                <ActiveIcon
                  size={22}
                  strokeWidth={1.8}
                  className="transition-all duration-300"
                />
              )}
            </div>

            <div>
              <h1 className="font-display text-xl font-bold text-white">
                Dashboard
              </h1>
              {activeTab?.hint && (
                <p className="mt-0.5 font-body text-xs text-white/90">
                  {activeTab.hint}
                </p>
              )}
            </div>
          </div>

          <div className="mx-6 mb-6 rounded-2xl bg-[#3B5280] p-3">
            <Slideshow />
          </div>
        </section>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        {/* Abas em "glassmorphism": contentor translúcido com desfoque
            (backdrop-blur) e botões em forma de pílula com ícone, título e
            subtítulo (`hint` definido em TABS). A aba activa
            (data-[state=active] do Radix) ganha gradiente azul, sombra e
            um visto à direita. As manchas desfocadas atrás existem só
            para o efeito de vidro ser visível sobre o fundo claro. */}
        <div className="relative bg-white px-6 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
            <TabsList className="flex h-auto w-full flex-wrap items-center justify-center gap-2 bg-transparent p-0">
              {availableTabs.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="group flex h-auto items-center gap-3 whitespace-nowrap rounded-full border border-white/70 bg-white/60 py-2 pl-2 pr-4 text-left font-body text-ink shadow-sm backdrop-blur transition-all duration-200
                               hover:scale-105 hover:bg-white/80 hover:shadow-md data-[state=inactive]:hover:border-primary motion-reduce:hover:scale-100
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                               data-[state=active]:border-transparent data-[state=active]:bg-[#0F1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold">{t.label}</span>
                      <span className="text-xs opacity-70 group-data-[state=active]:opacity-85">
                        {t.hint}
                      </span>
                    </span>
                    <CircleCheck
                      size={16}
                      strokeWidth={2}
                      className="hidden shrink-0 group-data-[state=active]:block"
                    />
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
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