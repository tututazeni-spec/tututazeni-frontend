// components/crm/partners/MilestonesSection.tsx
// Secção "Marcos" do detalhe de um parceiro: lista, formulário de novo marco e
// conclusão. O estado do formulário vive aqui, não em PartnerDetailView.

'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/components/crm/shared';
import {
  useCompleteMilestone,
  useCreateMilestone,
} from '@/hooks/usePartnerActions';
import { useFormState } from '@/hooks/useFormState';
import { EMPTY_MILESTONE_FORM, MILESTONE_COLORS } from './types';
import type { PartnerDetail } from './types';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMoney } from '@/lib/format';

const PRIORITY_ITEMS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export interface MilestonesSectionProps {
  partnerId: string;
  milestones: PartnerDetail['milestones'];
}

export function MilestonesSection({
  partnerId,
  milestones,
}: MilestonesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const { values: form, set, reset } = useFormState(EMPTY_MILESTONE_FORM);
  const createMilestone = useCreateMilestone(partnerId);
  const completeMilestone = useCompleteMilestone(partnerId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    createMilestone.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        reset();
      },
    });
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Marcos ({milestones.length})
        </h2>
        <Button
          onClick={() => setShowForm((s) => !s)}
          intent={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Novo Marco'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                required
                placeholder="Título"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="md:col-span-2"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                className="md:col-span-2"
              />
              <div>
                <label className="font-body text-xs text-ink-muted block mb-1">
                  Prazo
                </label>
                <Input
                  required
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                />
              </div>
              <Select
                value={form.priority}
                onValueChange={(value) => set('priority', value)}
                items={PRIORITY_ITEMS}
              />
              <Input
                type="number"
                min={0}
                placeholder="Valor (opcional)"
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
              />
              <Input
                placeholder="Moeda"
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMilestone.isPending}>
                  {createMilestone.isPending ? 'A guardar...' : 'Criar Marco'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <Card>
        <div className="divide-y divide-border">
          {milestones.length === 0 ? (
            <EmptyState variant="inline" title="Sem marcos registados" />
          ) : (
            milestones.map((m) => (
              <div key={m.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-body font-medium text-ink">{m.title}</p>
                  {m.description && (
                    <p className="font-body text-sm text-ink-muted">
                      {m.description}
                    </p>
                  )}
                  <p className="font-body text-xs text-ink-faint mt-1">
                    Prazo: {formatDate(m.dueDate)}
                    {m.value
                      ? ` · ${formatMoney(m.value, m.currency)}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                      MILESTONE_COLORS[m.status] ??
                        'bg-surface-sunken text-ink-muted',
                    )}
                  >
                    {m.status}
                  </span>
                  {m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && (
                    <button
                      onClick={() => completeMilestone.mutate(m.id)}
                      className="font-body text-xs text-success-ink hover:underline"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
