// components/crm/beneficiaries/NeedsSection.tsx
// Secção "Necessidades" do separador Perfil de um beneficiário: lista e
// formulário de nova necessidade. O estado do formulário vive aqui, não em
// BeneficiaryDetailView.

'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAddNeed } from '@/hooks/useBeneficiaryActions';
import { useFormState } from '@/hooks/useFormState';
import { useToast } from '@/providers/ToastProvider';
import { EMPTY_NEED_FORM, PRIORITY_COLORS } from './types';
import type { BeneficiaryDetail } from './types';

const PRIORITY_ITEMS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export interface NeedsSectionProps {
  beneficiaryId: string;
  needs: BeneficiaryDetail['needs'];
}

export function NeedsSection({ beneficiaryId, needs }: NeedsSectionProps) {
  const notify = useToast();
  const [showForm, setShowForm] = useState(false);
  const { values: form, set, reset } = useFormState(EMPTY_NEED_FORM);
  const addNeed = useAddNeed(beneficiaryId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addNeed.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        reset();
        notify({ title: 'Necessidade registada.', intent: 'success' });
      },
    });
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Necessidades ({needs.length})
        </h2>
        <Button
          onClick={() => setShowForm((s) => !s)}
          intent={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Nova Necessidade'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="space-y-3">
              <Input
                required
                placeholder="Categoria (ex.: Saúde, Habitação, Educação)"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              />
              <Textarea
                required
                placeholder="Descrição"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
              />
              <Select
                value={form.priority}
                onValueChange={(value) => set('priority', value)}
                items={PRIORITY_ITEMS}
              />
              <Button type="submit" disabled={addNeed.isPending}>
                {addNeed.isPending ? 'A guardar...' : 'Guardar Necessidade'}
              </Button>
            </CardBody>
          </Card>
        </form>
      )}

      <Card>
        <div className="divide-y divide-border">
          {needs.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">
              Sem necessidades registadas
            </p>
          ) : (
            needs.map((n) => (
              <div key={n.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium font-body text-ink">{n.category}</p>
                  <p className="font-body text-sm text-ink-muted">
                    {n.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                      PRIORITY_COLORS[n.priority] ??
                        'bg-surface-sunken text-ink-muted',
                    )}
                  >
                    {n.priority}
                  </span>
                  <span className="font-body text-xs text-ink-muted">
                    {n.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
