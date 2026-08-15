'use client';

// ─── app/(dashboard)/declarations/page.tsx ───────────────────────────────────
// INNOVA — Módulo de Declarações (Documentos + Work Declarations)
//
// Container: liga hooks/useDeclarations.ts (8 queries agrupadas) e as
// acções administrativas (aprovar/gerar documento, rever submissão,
// disparar lembretes — todas fazem `apiClient` + `refetchAll()`) à
// apresentação, agora repartida em components/declarations/. Migrado para a
// fundação de design: header/tabs bespoke passam a Button/IconButton
// (components/ui/Button) e Tabs/TabsList/TabsTrigger/TabsContent
// (components/ui/Tabs). Ver memory project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  BarChart3,
  Clipboard,
  FileText,
  Plus,
  RefreshCcw,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useDeclarationsData } from '@/hooks/useDeclarations';
import { Button, IconButton } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DocsAdminTab } from '@/components/declarations/DocsAdminTab';
import { MyDocsTab } from '@/components/declarations/MyDocsTab';
import { NewDocRequestModal } from '@/components/declarations/NewDocRequestModal';
import { WorkAdminTab } from '@/components/declarations/WorkAdminTab';
import { WorkDeclFormModal } from '@/components/declarations/WorkDeclFormModal';
import { WorkFormsTab } from '@/components/declarations/WorkFormsTab';
import type { WorkForm } from '@/components/declarations/types';

type TabKey = 'docs-my' | 'docs-admin' | 'work-my' | 'work-admin';

export default function DeclarationsPage() {
  const [tab, setTab] = useState<TabKey>('docs-my');
  const [showDocModal, setShowDocModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState<WorkForm | null>(null);

  const {
    templates,
    purposes,
    myDocs,
    allDocs,
    pendingWork,
    workSubs,
    docDash,
    workDash,
    loading,
    refetchAll,
  } = useDeclarationsData();

  const approveDoc = async (id: number) => {
    await apiClient.patch(`/declarations/documents/${id}/approve`, {
      approved: true,
    });
    refetchAll();
  };

  const generateDoc = async (id: number) => {
    await apiClient.patch(`/declarations/documents/${id}/generate`, {});
    refetchAll();
  };

  const reviewWorkSubmission = async (id: number, approved: boolean) => {
    await apiClient.patch(`/declarations/work/submissions/${id}/review`, {
      approved,
    });
    refetchAll();
  };

  const triggerPeriodicReminders = async () => {
    await apiClient.post('/declarations/work/trigger/periodic', {});
    refetchAll();
  };

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: LucideIcon;
    badge?: number;
  }> = [
    { key: 'docs-my', label: 'Minhas Declarações', icon: FileText },
    {
      key: 'work-my',
      label: 'Formulários',
      icon: Clipboard,
      badge: pendingWork?.total,
    },
    { key: 'docs-admin', label: 'Gerir Pedidos', icon: BarChart3 },
    { key: 'work-admin', label: 'Compliance', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Declarações</h1>
            <p className="font-body text-sm text-ink-muted">
              Documentos formais e compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowDocModal(true)}>
              <Plus size={15} strokeWidth={1.75} /> Solicitar Declaração
            </Button>
            <IconButton
              icon={RefreshCcw}
              label="Actualizar"
              intent="secondary"
              onClick={refetchAll}
              className={loading ? 'animate-spin' : ''}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-6 py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="flex items-center gap-2">
                <t.icon size={15} strokeWidth={1.75} />
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle font-body text-xs font-bold text-primary">
                    {t.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="docs-my">
            <MyDocsTab myDocs={myDocs} onRequestNew={() => setShowDocModal(true)} />
          </TabsContent>

          <TabsContent value="work-my">
            <WorkFormsTab
              pendingWork={pendingWork}
              workSubs={workSubs}
              onOpenForm={setShowWorkModal}
            />
          </TabsContent>

          <TabsContent value="docs-admin">
            <DocsAdminTab
              docDash={docDash}
              allDocs={allDocs}
              onApprove={approveDoc}
              onGenerate={generateDoc}
            />
          </TabsContent>

          <TabsContent value="work-admin">
            <WorkAdminTab
              workDash={workDash}
              workSubs={workSubs}
              onReview={reviewWorkSubmission}
              onTriggerReminders={triggerPeriodicReminders}
            />
          </TabsContent>
        </Tabs>
      </div>

      {showDocModal && (
        <NewDocRequestModal
          templates={templates}
          purposes={purposes}
          onClose={() => setShowDocModal(false)}
          onSuccess={refetchAll}
        />
      )}

      {showWorkModal && (
        <WorkDeclFormModal
          form={showWorkModal}
          onClose={() => setShowWorkModal(null)}
          onSuccess={refetchAll}
        />
      )}
    </div>
  );
}
