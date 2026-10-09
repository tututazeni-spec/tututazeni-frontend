// components/leave/DelegationsPanel.tsx
// Substituição temporária de aprovadores (docs/Modulo_Leave.md §10): durante o
// período indicado, os novos pedidos que lhe seriam atribuídos vão para o
// substituto — a troca fica no histórico de reatribuições do pedido. Cada
// aprovador gere as suas; ADMIN/RH podem criar em nome de outro.

'use client';

import { useState } from 'react';
import { AlertCircle, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useApproverCandidates, useDelegations } from '@/hooks/useLeave';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const today = () => new Date().toISOString().slice(0, 10);

export interface DelegationsPanelProps {
  /** ADMIN/RH: vêem todas e podem delegar em nome de outro aprovador. */
  isAdmin: boolean;
}

export function DelegationsPanel({ isAdmin }: DelegationsPanelProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const candidates = useApproverCandidates('', true);
  const { data: rows, loading } = useDelegations(isAdmin);

  const [delegatorId, setDelegatorId] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const items = candidates.map((c) => ({
    value: String(c.id),
    label: `${c.fullName}${c.role ? ` (${c.role.code})` : ''}`,
  }));

  const create = useApiMutation(
    () =>
      apiClient.post('/leave/settings/delegations', {
        delegatorId: isAdmin && delegatorId ? Number(delegatorId) : undefined,
        delegateId: Number(delegateId),
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      }),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () => {
        setDelegateId('');
        setEndDate('');
        setReason('');
        setError('');
        notify({ title: 'Substituição registada', intent: 'success' });
      },
      onError: (e) => setError(e.message),
    },
  );

  const revoke = useApiMutation(
    (id: number) => apiClient.delete(`/leave/settings/delegations/${id}`),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () => notify({ title: 'Substituição revogada', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const askRevoke = async (id: number) => {
    if (
      !(await confirm({
        title: 'Revogar esta substituição?',
        message:
          'Os novos pedidos voltam a ser atribuídos ao aprovador original. Os já atribuídos mantêm-se.',
        confirmLabel: 'Revogar',
        destructive: true,
      }))
    )
      return;
    revoke.mutate(id);
  };

  const invalid = !delegateId || !startDate || !endDate || endDate < startDate;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-4 space-y-4">
        <div className="-mx-4 -mt-4 bg-[#0F1F3D]/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Nova substituição</h3>
          <p className="text-xs text-white/80">
            Para quando estiver ausente: as suas aprovações vão para o
            substituto escolhido.
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {isAdmin && (
            <FormField
              label="Aprovador ausente"
              htmlFor="deleg-delegator"
              hint="Vazio = você"
            >
              <Combobox
                items={items}
                value={delegatorId}
                onValueChange={setDelegatorId}
                placeholder="Eu próprio"
                searchPlaceholder="Procurar…"
                emptyText="Ninguém encontrado"
                className="w-full"
              />
            </FormField>
          )}
          <FormField label="Substituto *" htmlFor="deleg-delegate">
            <Combobox
              items={items}
              value={delegateId}
              onValueChange={setDelegateId}
              placeholder="Seleccionar substituto"
              searchPlaceholder="Procurar…"
              emptyText="Ninguém encontrado"
              className="w-full"
            />
          </FormField>
          <FormField label="De *" htmlFor="deleg-start">
            <Input
              id="deleg-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField
            label="Até *"
            htmlFor="deleg-end"
            error={
              endDate && endDate < startDate
                ? 'A data de fim é anterior ao início'
                : undefined
            }
          >
            <Input
              id="deleg-end"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>
        <FormField label="Motivo" htmlFor="deleg-reason">
          <Textarea
            id="deleg-reason"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: férias"
            className="w-full"
          />
        </FormField>
        <div className="flex justify-end">
          <Button
            loading={create.isPending}
            disabled={invalid}
            onClick={() => {
              setError('');
              create.mutate(undefined);
            }}
          >
            Registar substituição
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">
          {isAdmin ? 'Substituições' : 'As minhas substituições'}
        </h3>
        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={UserRoundCheck}
            title="Sem substituições"
            description="Quando registar uma, ela aparece aqui até terminar."
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0 text-sm text-ink">
                  <span className="font-medium">{r.delegatorName ?? '—'}</span>
                  <span className="text-ink-faint"> → </span>
                  <span className="font-medium">{r.delegateName ?? '—'}</span>
                  <span className="ml-2 text-xs text-ink-faint">
                    {fmtDate(r.startDate)} a {fmtDate(r.endDate)}
                    {r.reason ? ` · ${r.reason}` : ''}
                    {!r.active ? ' · revogada' : ''}
                  </span>
                </div>
                {r.active && (
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => askRevoke(r.id)}
                  >
                    Revogar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
