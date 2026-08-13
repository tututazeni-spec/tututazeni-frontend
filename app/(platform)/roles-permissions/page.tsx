'use client';
// src/app/(dashboard)/roles-permissions/page.tsx

import { Shield } from 'lucide-react';
import { TABS } from '@/components/roles-permissions/constants';
import { GovernanceTab } from '@/components/roles-permissions/GovernanceTab';
import { MatrixTab } from '@/components/roles-permissions/MatrixTab';
import { RolesTab } from '@/components/roles-permissions/RolesTab';
import { SimulatorTab } from '@/components/roles-permissions/SimulatorTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function RolesPermissionsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-surface border-b border-border px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-accent-subtle rounded-control">
              <Shield size={18} strokeWidth={1.75} className="text-accent" />
            </div>
            <h1 className="text-xl font-display font-bold text-ink">
              Roles & Permissions
            </h1>
          </div>
          <p className="text-sm font-body text-ink-faint">
            Gestão de Roles · Matriz · Simulador · Templates · Governança
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles">
        <div className="bg-surface border-b border-border px-6">
          <TabsList className="max-w-7xl mx-auto overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          <TabsContent value="matrix">
            <MatrixTab />
          </TabsContent>
          <TabsContent value="simulator">
            <SimulatorTab />
          </TabsContent>
          <TabsContent value="governance">
            <GovernanceTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
