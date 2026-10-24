// components/crm/funders/GrantsSection.tsx
// Secção "Financiamentos / Subsídios" do detalhe de um financiador: lista,
// formulário de novo grant, mudança de estado e desembolsos. O estado do
// formulário e as mutações vivem aqui, não em FunderDetailView.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatMoney } from '@/components/crm/shared';
import {
  useAddDisbursement,
  useCreateGrant,
  useUpdateGrantStatus,
} from '@/hooks/useFunderActions';
import { useFormState } from '@/hooks/useFormState';
import { useToast } from '@/providers/ToastProvider';
import { GRANT_STATUS_OPTIONS } from './types';
import type { FunderDetail, GrantForm } from './types';

const EMPTY_GRANT_FORM: GrantForm = {
  title: '',
  amount: '',
  startDate: '',
  endDate: '',
};

export interface GrantsSectionProps {
  funderId: string;
  grants: FunderDetail['grants'];
}

export function GrantsSection({ funderId, grants }: GrantsSectionProps) {
  const notify = useToast();
  const [showForm, setShowForm] = useState(false);
  const { values: form, set, reset } = useFormState(EMPTY_GRANT_FORM);

  const createGrant = useCreateGrant(funderId);
  const updateStatus = useUpdateGrantStatus(funderId);
  const addDisbursement = useAddDisbursement(funderId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    createGrant.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        reset();
      },
    });
  }

  function onAddDisbursement(grantId: string) {
    const amountStr = window.prompt('Valor do desembolso (AOA):');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      notify({ title: 'Valor inválido', intent: 'danger' });
      return;
    }
    addDisbursement.mutate({ grantId, amount });
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Financiamentos / Subsídios ({grants.length})
        </h2>
        <Button
          onClick={() => setShowForm((s) => !s)}
          intent={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Novo Grant'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                required
                placeholder="Título do grant"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="md:col-span-2"
              />
              <Input
                required
                type="number"
                min={0}
                placeholder="Valor (AOA)"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
              <div />
              <div>
                <label className="font-body text-xs text-ink-muted block mb-1">
                  Data de início
                </label>
                <Input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="font-body text-xs text-ink-muted block mb-1">
                  Data de fim
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createGrant.isPending}>
                  {createGrant.isPending ? 'A guardar...' : 'Criar Grant'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <Card>
        <div className="divide-y divide-border">
          {grants.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">
              Sem grants registados
            </p>
          ) : (
            grants.map((g) => {
              const pct = g.amount > 0 ? (g.disbursed / g.amount) * 100 : 0;
              return (
                <div key={g.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-body font-medium text-ink">
                        <span className="font-mono text-primary mr-2">
                          {g.code}
                        </span>
                        {g.title}
                      </p>
                      <p className="font-body text-xs text-ink-muted mt-0.5">
                        {formatMoney(g.disbursed, g.currency)} de{' '}
                        {formatMoney(g.amount, g.currency)} ({pct.toFixed(0)}
                        %)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={g.status}
                        onValueChange={(status) =>
                          updateStatus.mutate({ grantId: g.id, status })
                        }
                        items={GRANT_STATUS_OPTIONS.map((s) => ({
                          value: s,
                          label: s,
                        }))}
                      />
                      {g.status === 'ACTIVE' && (
                        <button
                          onClick={() => onAddDisbursement(g.id)}
                          className="font-body text-xs text-success-ink hover:underline"
                        >
                          + Desembolso
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-sunken rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-2 bg-success rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </section>
  );
}
