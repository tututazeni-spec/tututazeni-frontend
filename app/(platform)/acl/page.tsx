'use client';
// app/(platform)/acl/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/acl/. Mesmo padrão que components/engagement/page.tsx.

import {
  Shield,
  Key,
  Settings,
  RefreshCw,
  BarChart2,
  Activity,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { AuditTab } from '@/components/acl/AuditTab';
import { MatrixTab } from '@/components/acl/MatrixTab';
import { OverviewTab } from '@/components/acl/OverviewTab';
import { PoliciesTab } from '@/components/acl/PoliciesTab';
import { RolesTab } from '@/components/acl/RolesTab';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import type { Tab } from '@/components/acl/types';

const TABS: Array<PillTabItem & { id: Tab }> = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo de acessos',
    icon: BarChart2,
  },
  { id: 'roles', label: 'Roles', hint: 'Perfis e funções', icon: Shield },
  { id: 'matrix', label: 'Matriz', hint: 'Permissões por role', icon: Key },
  { id: 'policies', label: 'Políticas', hint: 'Regras ABAC', icon: Settings },
  {
    id: 'audit',
    label: 'Auditoria',
    hint: 'Registo de alterações',
    icon: Activity,
  },
];

export default function AclPage() {
  const notify = useToast();

  const seedPermissions = async () => {
    try {
      await apiClient.post('/acl/seed-permissions', {});
      notify({ title: 'Permissões semeadas com sucesso', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'AclPage.seedPermissions' });
      notify({
        title: 'Não foi possível semear as permissões',
        intent: 'danger',
      });
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-danger-subtle p-1.5">
                <Shield size={18} strokeWidth={1.75} className="text-danger" />
              </div>
              <h1 className="font-display text-xl font-bold text-ink">
                Access Control
              </h1>
            </div>
            <p className="font-body text-sm text-ink-faint">
              RBAC · ABAC · Roles · Permissões · Políticas · Auditoria
            </p>
          </div>
          <Button
            intent="secondary"
            size="sm"
            onClick={() => seedPermissions()}
          >
            <RefreshCw size={14} strokeWidth={1.75} />
            Seed Permissões
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="bg-surface px-6 py-5">
          <PillTabsList items={TABS} className="mx-auto max-w-7xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          <TabsContent value="matrix">
            <MatrixTab />
          </TabsContent>
          <TabsContent value="policies">
            <PoliciesTab />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
