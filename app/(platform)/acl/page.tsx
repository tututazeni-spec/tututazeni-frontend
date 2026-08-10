'use client';
// src/app/(dashboard)/acl/page.tsx

import { useState } from 'react';
import {
  Shield,
  Key,
  Settings,
  RefreshCw,
  BarChart2,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { AuditTab } from '@/components/acl/AuditTab';
import { MatrixTab } from '@/components/acl/MatrixTab';
import { OverviewTab } from '@/components/acl/OverviewTab';
import { PoliciesTab } from '@/components/acl/PoliciesTab';
import { RolesTab } from '@/components/acl/RolesTab';
import type { Tab } from '@/components/acl/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'matrix', label: 'Matriz', icon: Key },
  { id: 'policies', label: 'Políticas', icon: Settings },
  { id: 'audit', label: 'Auditoria', icon: Activity },
];

const PANELS: Record<Tab, JSX.Element> = {
  overview: <OverviewTab />,
  roles: <RolesTab />,
  matrix: <MatrixTab />,
  policies: <PoliciesTab />,
  audit: <AuditTab />,
};

export default function AclPage() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Shield size={18} className="text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Access Control
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              RBAC · ABAC · Roles · Permissões · Políticas · Auditoria
            </p>
          </div>
          <button
            onClick={() => {
              void apiClient.post('/acl/seed-permissions', {}).catch(() => {});
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200"
          >
            <RefreshCw size={13} />
            Seed Permissões
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-red-600 text-red-600'
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

      <div className="max-w-7xl mx-auto px-6 py-6">{PANELS[tab]}</div>
    </div>
  );
}
