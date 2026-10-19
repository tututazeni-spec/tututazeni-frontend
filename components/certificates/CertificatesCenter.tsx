// components/certificates/CertificatesCenter.tsx
// Centro de certificados partilhado: montado em Cursos → Certificados e em
// Gestão de Formações → Certificados, sobre os mesmos endpoints e a mesma cache.
//  - ADMIN/RH/AUDITOR: tudo (RH/ADMIN também gerem; AUDITOR só lê e exporta).
//  - GESTOR/LIDER/DIRECTOR: só a equipa directa; aprovam, não gerem.
//  - Restantes papéis: só os seus certificados.
// A autorização real é sempre feita no backend; aqui só se decide o que mostrar.

'use client';

import { useState } from 'react';
import { PillNav } from '@/components/ui/PillTabs';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { CertificatesView } from '@/components/courses/CertificatesView';
import { OverviewTab } from './OverviewTab';
import { CertificatesTab } from './CertificatesTab';
import { TemplateGallery } from './TemplateGallery';
import { RulesTab } from './RulesTab';
import { HistoryTab } from './HistoryTab';
import { TeamSummaryTab } from './TeamSummaryTab';
import type { EffectiveStatus } from './types';

const ADMIN_ROLES = ['ADMIN', 'RH', 'AUDITOR'];
const MANAGER_ROLES = ['GESTOR', 'LIDER', 'DIRECTOR'];
// Escrita (regras, revogar, importar, lote): ADMIN/RH. Aprovar: também gestores (da equipa).
const WRITE_ROLES = ['ADMIN', 'RH'];
const APPROVE_ROLES = ['ADMIN', 'RH', ...MANAGER_ROLES];

const ADMIN_TABS = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'team', label: 'Equipa' },
  { id: 'list', label: 'Certificados' },
  { id: 'templates', label: 'Modelos' },
  { id: 'rules', label: 'Regras' },
  { id: 'history', label: 'Histórico' },
  { id: 'mine', label: 'Os meus' },
] as const;

const MANAGER_TABS = [
  { id: 'team', label: 'Visão da equipa' },
  { id: 'list', label: 'Certificados' },
  { id: 'mine', label: 'Os meus' },
] as const;

type TabId = (typeof ADMIN_TABS)[number]['id'];

export function CertificatesCenter() {
  const role = useCurrentRole();
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const isManager = !!role && MANAGER_ROLES.includes(role);
  const [tab, setTab] = useState<TabId | null>(null);
  const [status, setStatus] = useState<EffectiveStatus | ''>('');

  if (!isAdmin && !isManager) return <CertificatesView />;

  const tabs = isAdmin ? ADMIN_TABS : MANAGER_TABS;
  const current: TabId = tab ?? tabs[0].id;
  const canWrite = !!role && WRITE_ROLES.includes(role);
  const canApprove = !!role && APPROVE_ROLES.includes(role);

  return (
    <div className="space-y-6">
      <PillNav
        items={tabs}
        value={current}
        onChange={(id) => {
          setStatus('');
          setTab(id as TabId);
        }}
        label="Certificados"
      />
      {current === 'overview' && (
        <OverviewTab
          onOpen={(s) => {
            setStatus(s);
            setTab('list');
          }}
        />
      )}
      {current === 'team' && <TeamSummaryTab pickDepartment={isAdmin} />}
      {current === 'list' && (
        <CertificatesTab
          key={status}
          canManage={canWrite}
          canApprove={canApprove}
          initialStatus={status}
        />
      )}
      {current === 'templates' && <TemplateGallery canEdit={canWrite} />}
      {current === 'rules' && <RulesTab canEdit={canWrite} />}
      {current === 'history' && <HistoryTab />}
      {current === 'mine' && <CertificatesView />}
    </div>
  );
}
