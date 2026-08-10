'use client';
// src/app/(dashboard)/roles-permissions/page.tsx

import { useState } from 'react';
import { Shield } from 'lucide-react';
import { TABS } from '@/components/roles-permissions/constants';
import { GovernanceTab } from '@/components/roles-permissions/GovernanceTab';
import { MatrixTab } from '@/components/roles-permissions/MatrixTab';
import { RolesTab } from '@/components/roles-permissions/RolesTab';
import { SimulatorTab } from '@/components/roles-permissions/SimulatorTab';
import type { Tab } from '@/components/roles-permissions/types';

const PANELS: Record<Tab, JSX.Element> = {
  roles: <RolesTab />,
  matrix: <MatrixTab />,
  simulator: <SimulatorTab />,
  governance: <GovernanceTab />,
};

export default function RolesPermissionsPage() {
  const [tab, setTab] = useState<Tab>('roles');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Shield size={18} className="text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              Roles & Permissions
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Gestão de Roles · Matriz · Simulador · Templates · Governança
          </p>
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

      <div className="max-w-7xl mx-auto px-6 py-6">{PANELS[tab]}</div>
    </div>
  );
}
