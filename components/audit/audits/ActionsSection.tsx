// components/audit/audits/ActionsSection.tsx
// Plano de ações corretivas (apresentação).

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import {
  fmtDay,
  findingSelectItems,
  findingSelectValue,
  parseFindingChoice,
} from './logic';
import { ACTION_STATUS, actionStatusLabel } from './constants';
import { Section } from './shared';
import { AddButton, SubmitRow } from './detailParts';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail } from '../types';

export function ActionsSection({
  audit: a,
  ctl,
}: {
  audit: InternalAuditDetail;
  ctl: InternalAuditDetailController;
}) {
  const {
    phase: { actionable },
    form,
    f,
    set,
    responsible,
    setResponsible,
    toggle,
    closeForm,
    formValid,
    submit,
    updateActionStatus,
    pending,
  } = ctl;

  return (
    <Section
      title={`Plano de ações corretivas (${a.actions.length})`}
      action={
        actionable && (
          <AddButton
            label="Criar ação corretiva"
            onClick={() => toggle('action')}
          />
        )
      }
    >
      {form === 'action' && (
        <div className="space-y-2 py-2">
          <Textarea
            rows={2}
            className="w-full"
            placeholder="Ação a executar *"
            value={f.description}
            onChange={(e) => set({ description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              items={findingSelectItems(a.findings)}
              value={findingSelectValue(f.findingId)}
              onValueChange={(v) => set({ findingId: parseFindingChoice(v) })}
            />
            <Input
              type="date"
              value={f.dueDate}
              onChange={(e) => set({ dueDate: e.target.value })}
            />
          </div>
          <DepartmentUserPicker
            label="Responsável"
            htmlFor="aud-act-resp"
            value={responsible}
            onChange={setResponsible}
          />
          <SubmitRow
            pending={pending.action}
            disabled={!formValid}
            onClick={submit.action}
            onCancel={closeForm}
          />
        </div>
      )}
      {a.actions.length === 0 && (
        <p className="py-1 text-ink-faint">Sem ações corretivas.</p>
      )}
      {a.actions.map((x) => (
        <div
          key={x.id}
          className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <div className="text-ink">{x.description}</div>
            <div className="text-ink-faint">
              {x.responsible?.fullName ?? 'Sem responsável'} · prazo{' '}
              {fmtDay(x.dueDate)}
            </div>
          </div>
          {actionable ? (
            <Select
              items={ACTION_STATUS}
              value={x.status}
              onValueChange={(v) => updateActionStatus(x.id, v)}
              className="w-36"
            />
          ) : (
            <span className="text-ink-muted">
              {actionStatusLabel(x.status)}
            </span>
          )}
        </div>
      ))}
    </Section>
  );
}
