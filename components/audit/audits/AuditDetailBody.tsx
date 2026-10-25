// components/audit/audits/AuditDetailBody.tsx
// Corpo do detalhe de uma auditoria (apresentação): compõe a ficha, o fluxo e
// as secções de verificações, evidências, constatações, ações e histórico.
// Estado, mutações e fase do fluxo vêm de hooks/useInternalAuditDetail.ts.

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import { ActionsSection } from './ActionsSection';
import { AuditInfo } from './AuditInfo';
import { ChecksSection } from './ChecksSection';
import { EvidencesSection } from './EvidencesSection';
import { FindingsSection } from './FindingsSection';
import { HistorySection } from './HistorySection';
import { canExportReport } from './logic';
import { Section } from './shared';
import { WorkflowSection } from './WorkflowSection';
import type { InternalAuditDetail } from '../types';

interface AuditDetailBodyProps {
  audit: InternalAuditDetail;
  ctl: InternalAuditDetailController;
}

export function AuditDetailBody({ audit: a, ctl }: AuditDetailBodyProps) {
  const { exportReport, pending } = ctl;

  return (
    <div className="mt-4 space-y-5 font-body text-xs">
      <AuditInfo audit={a} />
      <WorkflowSection audit={a} ctl={ctl} />
      <ChecksSection audit={a} ctl={ctl} />
      <EvidencesSection audit={a} ctl={ctl} />
      <FindingsSection audit={a} ctl={ctl} />
      <ActionsSection audit={a} ctl={ctl} />

      {a.closingReport && (
        <Section title="Relatório de encerramento">
          <p className="whitespace-pre-wrap py-1 text-ink">{a.closingReport}</p>
        </Section>
      )}

      {canExportReport(a.status) && (
        <Button
          size="sm"
          intent="secondary"
          loading={pending.export}
          onClick={exportReport}
        >
          <Download size={14} /> Exportar relatório final
        </Button>
      )}

      <HistorySection audit={a} />
    </div>
  );
}
