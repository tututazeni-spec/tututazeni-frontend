// components/crm/funders/InteractionsSection.tsx
// Secção "Interacções" do detalhe de um financiador: lista e formulário de
// nova interacção. O estado do formulário vive aqui, não em FunderDetailView.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/components/crm/shared';
import { useCreateInteraction } from '@/hooks/useFunderActions';
import { useFormState } from '@/hooks/useFormState';
import type { FunderDetail, InteractionForm } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

const EMPTY_INTERACTION_FORM: InteractionForm = {
  type: 'MEETING',
  subject: '',
  description: '',
  outcome: '',
};

const TYPE_ITEMS = [
  { value: 'MEETING', label: 'Reunião' },
  { value: 'CALL', label: 'Chamada' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'VISIT', label: 'Visita' },
  { value: 'EVENT', label: 'Evento' },
  { value: 'NOTE', label: 'Nota' },
  { value: 'REVIEW', label: 'Revisão' },
];

export interface InteractionsSectionProps {
  funderId: string;
  interactions: FunderDetail['interactions'];
}

export function InteractionsSection({
  funderId,
  interactions,
}: InteractionsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const { values: form, set, reset } = useFormState(EMPTY_INTERACTION_FORM);
  const createInteraction = useCreateInteraction(funderId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    createInteraction.mutate(form, {
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
          Interacções ({interactions.length})
        </h2>
        <Button
          onClick={() => setShowForm((s) => !s)}
          intent={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Nova Interacção'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="space-y-3">
              <Select
                value={form.type}
                onValueChange={(value) => set('type', value)}
                items={TYPE_ITEMS}
              />
              <Input
                required
                placeholder="Assunto"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
              />
              <Textarea
                required
                placeholder="Descrição"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
              />
              <Input
                placeholder="Resultado (opcional)"
                value={form.outcome}
                onChange={(e) => set('outcome', e.target.value)}
              />
              <Button type="submit" disabled={createInteraction.isPending}>
                {createInteraction.isPending
                  ? 'A guardar...'
                  : 'Guardar Interacção'}
              </Button>
            </CardBody>
          </Card>
        </form>
      )}

      <Card>
        <div className="divide-y divide-border">
          {interactions.length === 0 ? (
            <EmptyState variant="inline" title="Sem interacções registadas" />
          ) : (
            interactions.map((it) => (
              <div key={it.id} className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-body font-medium text-ink">
                    <span className="font-body text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded mr-2">
                      {it.type}
                    </span>
                    {it.subject}
                  </span>
                  <span className="font-body text-xs text-ink-faint">
                    {formatDate(it.date)}
                  </span>
                </div>
                <p className="font-body text-sm text-ink-muted mt-1">
                  {it.description}
                </p>
                <div className="flex gap-4 mt-1 font-body text-xs text-ink-faint">
                  {it.user?.fullName && <span>Por: {it.user.fullName}</span>}
                  {it.outcome && <span>Resultado: {it.outcome}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
