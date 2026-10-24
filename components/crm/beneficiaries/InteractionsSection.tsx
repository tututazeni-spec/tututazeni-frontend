// components/crm/beneficiaries/InteractionsSection.tsx
// Secção "Interacções" de um beneficiário: lista e formulário de nova
// interacção. A mutation é optimista, por isso o formulário fecha e limpa-se
// logo ao submeter (a entrada já aparece na lista, esbatida, com "A guardar…").
// O estado do formulário vive aqui, não em BeneficiaryDetailView.

'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field, formatDate } from '@/components/crm/shared';
import { useAddBeneficiaryInteraction } from '@/hooks/useBeneficiaryActions';
import { useFormState } from '@/hooks/useFormState';
import { INTERACTION_TYPE_OPTIONS } from './formConfig';
import { EMPTY_INTERACTION_FORM } from './types';
import type { BeneficiaryDetail } from './types';

export interface InteractionsSectionProps {
  beneficiaryId: string;
  interactions: BeneficiaryDetail['interactions'];
}

export function InteractionsSection({
  beneficiaryId,
  interactions,
}: InteractionsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const { values: form, set, reset } = useFormState(EMPTY_INTERACTION_FORM);
  const addInteraction = useAddBeneficiaryInteraction(beneficiaryId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // UI optimista: fecha o form e limpa de imediato; a entrada já aparece na lista.
    addInteraction.mutate(form);
    setShowForm(false);
    reset();
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
        <form onSubmit={submit} className="mb-4 space-y-3">
          <Card>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  value={form.type}
                  onValueChange={(value) => set('type', value)}
                  items={INTERACTION_TYPE_OPTIONS}
                />
                <Input
                  type="number"
                  min={1}
                  max={5}
                  placeholder="Satisfação (1-5)"
                  value={form.satisfaction}
                  onChange={(e) => set('satisfaction', e.target.value)}
                />
              </div>
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
                placeholder="Canal (ex.: Linha de apoio, Balcão)"
                value={form.channel}
                onChange={(e) => set('channel', e.target.value)}
              />
              <Input
                placeholder="Resultado (opcional)"
                value={form.outcome}
                onChange={(e) => set('outcome', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Próxima acção"
                  value={form.nextAction}
                  onChange={(e) => set('nextAction', e.target.value)}
                />
                <Field label="Data da próxima acção">
                  <Input
                    type="date"
                    value={form.nextActionDate}
                    onChange={(e) => set('nextActionDate', e.target.value)}
                  />
                </Field>
              </div>
              <Textarea
                rows={2}
                placeholder="Observações"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
              <Button type="submit">Guardar Interacção</Button>
            </CardBody>
          </Card>
        </form>
      )}

      <Card>
        <div className="divide-y divide-border">
          {interactions.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">
              Sem interacções registadas
            </p>
          ) : (
            interactions.map((it) => (
              <div
                key={it.id}
                className={cn('p-4', it._optimistic && 'opacity-60')}
              >
                <div className="flex justify-between items-center">
                  <span className="font-body font-medium">
                    <span className="font-body text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded mr-2">
                      {it.type}
                    </span>
                    {it.subject}
                  </span>
                  <span className="font-body text-xs text-ink-faint">
                    {it._optimistic ? 'A guardar…' : formatDate(it.date)}
                  </span>
                </div>
                <p className="font-body text-sm text-ink-muted mt-1">
                  {it.description}
                </p>
                <div className="flex gap-4 mt-1 font-body text-xs text-ink-faint">
                  {it.user?.fullName && <span>Por: {it.user.fullName}</span>}
                  {it.outcome && <span>Resultado: {it.outcome}</span>}
                  {it.satisfaction != null && (
                    <span>Satisfação: {it.satisfaction}/5</span>
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
