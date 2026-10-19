// components/certificates/CertificatesCenter.tsx
// Centro de certificados partilhado: montado em Cursos → Certificados e em
// Gestão de Formações → Certificados, sobre os mesmos endpoints e a mesma cache.
// Quem não gere certificados (colaborador, gestor, ...) vê só os seus; a
// autorização real é sempre feita no backend.

'use client';

import { useState } from 'react';
import { PillNav } from '@/components/ui/PillTabs';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { CertificatesView } from '@/components/courses/CertificatesView';
import { OverviewTab } from './OverviewTab';
import { CertificatesTab } from './CertificatesTab';
import { TemplatesTab } from './TemplatesTab';
import { RulesTab } from './RulesTab';
import { HistoryTab } from './HistoryTab';
import type { EffectiveStatus } from './types';

// Leitura: ADMIN/RH/AUDITOR. Escrita (aprovar, regras): ADMIN/RH.
const READ_ROLES = ['ADMIN', 'RH', 'AUDITOR'];
const WRITE_ROLES = ['ADMIN', 'RH'];

const TABS = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'list', label: 'Certificados' },
  { id: 'templates', label: 'Modelos' },
  { id: 'rules', label: 'Regras' },
  { id: 'history', label: 'Histórico' },
  { id: 'mine', label: 'Os meus' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CertificatesCenter() {
  const role = useCurrentRole();
  const [tab, setTab] = useState<TabId>('overview');
  const [status, setStatus] = useState<EffectiveStatus | ''>('');

  if (!role || !READ_ROLES.includes(role)) return <CertificatesView />;

  const canWrite = WRITE_ROLES.includes(role);

  return (
    <div className="space-y-6">
      <PillNav
        items={TABS}
        value={tab}
        onChange={(id) => {
          setStatus('');
          setTab(id as TabId);
        }}
        label="Certificados"
      />
      {tab === 'overview' && (
        <OverviewTab
          onOpen={(s) => {
            setStatus(s);
            setTab('list');
          }}
        />
      )}
      {tab === 'list' && (
        <CertificatesTab
          key={status}
          canManage={canWrite}
          initialStatus={status}
        />
      )}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'rules' && <RulesTab canEdit={canWrite} />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'mine' && <CertificatesView />}
    </div>
  );
}
