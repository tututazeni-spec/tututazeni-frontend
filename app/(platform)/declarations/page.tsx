'use client';

// ─── app/(dashboard)/declarations/page.tsx ───────────────────────────────────
// INNOVA — Módulo de Declarações (Documentos + Work Declarations)
//
// Container: liga hooks/useDeclarations.ts (8 queries agrupadas) e as
// acções administrativas (aprovar/gerar documento, rever submissão,
// disparar lembretes — todas fazem `apiClient` + `refetchAll()`) à
// apresentação, agora repartida em components/declarations/. Ver memory
// project_innova_component_separation_audit.
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Declarações</h1>
            <p className="text-sm text-gray-500">
              Documentos formais e compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={15} /> Solicitar Declaração
            </button>
            <button
              onClick={refetchAll}
              aria-label="Actualizar"
              className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50"
            >
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors relative ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <t.icon size={15} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === t.key ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'docs-my' && (
          <MyDocsTab
            myDocs={myDocs}
            onRequestNew={() => setShowDocModal(true)}
          />
        )}

        {tab === 'work-my' && (
          <WorkFormsTab
            pendingWork={pendingWork}
            workSubs={workSubs}
            onOpenForm={setShowWorkModal}
          />
        )}

        {tab === 'docs-admin' && (
          <DocsAdminTab
            docDash={docDash}
            allDocs={allDocs}
            onApprove={approveDoc}
            onGenerate={generateDoc}
          />
        )}

        {tab === 'work-admin' && (
          <WorkAdminTab
            workDash={workDash}
            workSubs={workSubs}
            onReview={reviewWorkSubmission}
            onTriggerReminders={triggerPeriodicReminders}
          />
        )}
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
