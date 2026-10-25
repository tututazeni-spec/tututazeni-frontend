// components/audit/audits/ChecksSection.tsx
// Verificações da auditoria (apresentação).

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CHECK_STATUS, checkStatusLabel } from './constants';
import { Section } from './shared';
import { AddButton, SubmitRow } from './detailParts';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';

export function ChecksSection({
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
    updateCheckStatus,
    pending,
  } = ctl;

  return (
    <Section
      title={`Verificações (${a.checks.length})`}
      action={
        collecting && (
          <AddButton
            label="Adicionar verificação"
            onClick={() => toggle('check')}
          />
        )
      }
    >
      {form === 'check' && (
        <div className="space-y-2 py-2">
          <Input
            placeholder="Verificação a efetuar"
            value={f.title}
            onChange={(e) => set({ title: e.target.value })}
          />
          <SubmitRow
            pending={pending.check}
            disabled={!formValid}
            onClick={submit.check}
            onCancel={closeForm}
          />
        </div>
      )}
      {a.checks.length === 0 && (
        <EmptyState variant="inline" title="Sem verificações" />
      )}
      {a.checks.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
        >
          <span className="min-w-0 flex-1 text-ink">{c.title}</span>
          {collecting ? (
            <Select
              items={CHECK_STATUS}
              value={c.status}
              onValueChange={(v) => updateCheckStatus(c.id, v)}
              className="w-44"
            />
          ) : (
            <span className="text-ink-muted">{checkStatusLabel(c.status)}</span>
          )}
        </div>
      ))}
    </Section>
  );
}
