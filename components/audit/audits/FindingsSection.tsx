// components/audit/audits/FindingsSection.tsx
// Constatações e riscos da auditoria (apresentação).

import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SEVERITY_CFG } from '../constants';
import { findingKindLabel } from './logic';
import { RISK_ITEMS } from './constants';
import { Section } from './shared';
import { AddButton, SubmitRow } from './detailParts';
import type { Severity } from '../types';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';

export function FindingsSection({
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
      title={`Constatações e riscos (${a.findings.length})`}
      action={
        collecting && (
          <AddButton
            label="Registar constatação"
            onClick={() => toggle('finding')}
          />
        )
      }
    >
      {form === 'finding' && (
        <div className="space-y-2 py-2">
          <Input
            placeholder="Constatação *"
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
            <Select
              items={[
                { value: 'true', label: 'Não conformidade' },
                { value: 'false', label: 'Observação' },
              ]}
              value={f.nonConformity}
              onValueChange={(v) => set({ nonConformity: v })}
            />
            <Select
              items={RISK_ITEMS}
              value={f.risk}
              onValueChange={(v) => set({ risk: v as Severity })}
            />
          </div>
          <Textarea
            rows={2}
            className="w-full"
            placeholder="Recomendação"
            value={f.recommendation}
            onChange={(e) => set({ recommendation: e.target.value })}
          />
          <SubmitRow
            pending={pending.finding}
            disabled={!formValid}
            onClick={submit.finding}
            onCancel={closeForm}
          />
        </div>
      )}
      {a.findings.length === 0 && (
        <EmptyState variant="inline" title="Sem constatações" />
      )}
      {a.findings.map((x) => (
        <div key={x.id} className="border-b border-border py-1.5 last:border-0">
          <div className="flex items-center gap-2 text-ink">
            <span className="font-medium">{x.title}</span>
            <Badge intent={x.nonConformity ? 'danger' : 'neutral'} dot={false}>
              {findingKindLabel(x.nonConformity)}
            </Badge>
            <span className={SEVERITY_CFG[x.risk].cls}>
              Risco {SEVERITY_CFG[x.risk].label.toLowerCase()}
            </span>
          </div>
          {x.description && (
            <div className="text-ink-muted">{x.description}</div>
          )}
          {x.recommendation && (
            <div className="text-ink-muted">
              Recomendação: {x.recommendation}
            </div>
          )}
        </div>
      ))}
    </Section>
  );
}
