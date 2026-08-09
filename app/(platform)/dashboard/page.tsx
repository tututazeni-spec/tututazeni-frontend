'use client';
// src/app/(dashboard)/dashboard/page.tsx
//
// Container: gere o separador activo, o modal de pesquisa global e o badge
// de alertas urgentes no header; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/dashboard/ (mesmo
// padrão que components/payslips/page.tsx usa para ListView/CompareView/
// AnnualView). Ver memory project_innova_component_separation_audit.

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
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { queryKeys } from '@/lib/queryKeys';
import {
  ADMIN_ROLES,
  AUTHENTICATED_ROLES,
  filterByRole,
  MGMT_ROLES,
  type Role,
} from '@/lib/roles';
import { ColaboradorDashboard } from '@/components/dashboard/ColaboradorDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';
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
  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.role?.name ?? 'COLABORADOR') as Role;

  // Partilha a mesma key /dashboard/alerts dos sub-dashboards → 0 pedidos extra.
  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.dashboard.alerts(),
    '/dashboard/alerts',
    { refetchInterval: ALERTS_POLL_MS },
  );
  const alertCount = alerts.filter((x) => x.priority === 'URGENT').length;

  const availableTabs = filterByRole(TABS, role);

  const TAB_CONTENT: Record<string, JSX.Element> = {
    personal: <ColaboradorDashboard />,
    manager: <ManagerDashboard />,
    org: <OrgDashboard />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <LayoutDashboard size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
            </div>
            <p className="text-sm text-slate-400">
              Visão unificada · KPIs · Insights · Alertas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-indigo-300 transition-colors"
            >
              <Search size={14} />
              Pesquisar
            </button>
            <button
              aria-label="Notificações"
              className="relative flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-slate-300 transition-colors"
            >
              <Bell size={14} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {alertCount}
                </span>
              )}
            </button>
            <button
              onClick={() => window.location.reload()}
              aria-label="Actualizar"
              className="p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300"
            >
              <RefreshCw size={15} className="text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {availableTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {TAB_CONTENT[tab] ?? <ColaboradorDashboard />}
      </div>
    </div>
  );
}
