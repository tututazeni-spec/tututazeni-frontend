// components/audit/AuditsView.tsx
// Aba 06 «Auditorias e Inspeções» (docs/modulo_audit.md §9): auditorias
// internas formais — verificações, evidências, constatações, ações corretivas
// e aprovação final do relatório (registada como evento de auditoria).
//
// Container: liga os hooks de dados às vistas de apresentação em ./audits/.
//   hooks/useInternalAuditsList.ts   lista + filtros
//   hooks/useCreateInternalAudit.ts  formulário «Nova auditoria»
//   hooks/useInternalAuditDetail.ts  detalhe, formulários inline e mutações
//   ./audits/logic.ts                regras puras (fases, validação, payloads)

'use client';

import { useState } from 'react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCreateInternalAudit } from '@/hooks/useCreateInternalAudit';
import { useInternalAuditDetail } from '@/hooks/useInternalAuditDetail';
import { useInternalAuditsList } from '@/hooks/useInternalAuditsList';
import { AuditDetailBody } from './audits/AuditDetailBody';
import { AuditsListView } from './audits/AuditsListView';
import { NewAuditForm } from './audits/NewAuditForm';

function NewAuditModal({ onClose }: { onClose: () => void }) {
  const ctl = useCreateInternalAudit(onClose);
  return <NewAuditForm ctl={ctl} onClose={onClose} />;
}

function AuditModal({
  auditId,
  onClose,
}: {
  auditId: number;
  onClose: () => void;
}) {
  const ctl = useInternalAuditDetail(auditId);
  const { audit } = ctl;
  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={audit ? `${audit.code} — ${audit.title}` : 'Auditoria'}
        className="max-h-[92vh] max-w-3xl overflow-y-auto"
      >
        {!audit ? (
          <Skeleton rows={6} />
        ) : (
          <AuditDetailBody audit={audit} ctl={ctl} />
        )}
      </ModalContent>
    </Modal>
  );
}

export function AuditsView() {
  const list = useInternalAuditsList();
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <AuditsListView
        list={list}
        onOpen={setOpenId}
        onCreate={() => setCreating(true)}
      />
      {creating && <NewAuditModal onClose={() => setCreating(false)} />}
      {openId != null && (
        <AuditModal auditId={openId} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
