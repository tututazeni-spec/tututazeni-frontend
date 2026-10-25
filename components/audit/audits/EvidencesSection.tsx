// components/audit/audits/EvidencesSection.tsx
// Evidências da auditoria (apresentação).

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { safeHref } from '@/lib/safeHref';
import { fmtTs } from '../utils';
import { Section } from './shared';
import { AddButton, SubmitRow } from './detailParts';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail } from '../types';

export function EvidencesSection({
  audit: a,
  ctl,
}: {
  audit: InternalAuditDetail;
  ctl: InternalAuditDetailController;
}) {
  const {
    phase: { collecting },
    form,
    f,
    set,
    toggle,
    closeForm,
    formValid,
    submit,
    pending,
  } = ctl;

  return (
    <Section
      title={`Evidências (${a.evidences.length})`}
      action={
        collecting && (
          <AddButton
            label="Anexar evidência"
            onClick={() => toggle('evidence')}
          />
        )
      }
    >
      {form === 'evidence' && (
        <div className="space-y-2 py-2">
          <Input
            placeholder="Título da evidência *"
            value={f.title}
            onChange={(e) => set({ title: e.target.value })}
          />
          <Textarea
            rows={2}
            className="w-full"
            placeholder="Descrição"
            value={f.description}
            onChange={(e) => set({ description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Ligação (URL)"
              value={f.url}
              onChange={(e) => set({ url: e.target.value })}
            />
            <Input
              type="number"
              min={1}
              placeholder="ID de evento de auditoria"
              value={f.auditLogId}
              onChange={(e) => set({ auditLogId: e.target.value })}
            />
          </div>
          <SubmitRow
            pending={pending.evidence}
            disabled={!formValid}
            onClick={submit.evidence}
            onCancel={closeForm}
          />
        </div>
      )}
      {a.evidences.length === 0 && (
        <p className="py-1 text-ink-faint">Sem evidências.</p>
      )}
      {a.evidences.map((e) => (
        <div key={e.id} className="border-b border-border py-1.5 last:border-0">
          <div className="text-ink">
            {e.title}
            {e.auditLogId != null && (
              <span className="text-ink-faint"> · evento #{e.auditLogId}</span>
            )}
          </div>
          {e.description && (
            <div className="text-ink-muted">{e.description}</div>
          )}
          {e.url && (
            <a
              href={safeHref(e.url)}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {e.url}
            </a>
          )}
          <div className="text-ink-faint">
            {e.addedBy?.fullName ?? '—'} · {fmtTs(e.createdAt)}
          </div>
        </div>
      ))}
    </Section>
  );
}
