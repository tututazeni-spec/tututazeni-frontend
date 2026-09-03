// components/payroll/CreatePayslipModal.tsx
// Criar um recibo individual (POST /payslips) com picker de colaborador.
// Campos base sempre enviados: userId/period/paymentDate/baseSalary. Os
// campos numéricos avançados (subsídios / deduções) só vão no body quando
// preenchidos — vazio = omitido. 409 = recibo do período já existe.
// Aberto/possuído por payslips admin page.tsx (Task 14).
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useDirectoryUsers } from '@/components/payslips/compensationData';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface CreatePayslipModalProps {
  onClose: () => void;
  onCreated: (id: number) => void;
}

const EARNINGS = [
  ['mealAllowance', 'Subsídio de alimentação'],
  ['vacationAllowance', 'Subsídio de férias'],
  ['christmasAllowance', 'Subsídio de Natal'],
  ['overtime', 'Horas extras'],
  ['bonuses', 'Prémios / Comissões'],
  ['otherAllowances', 'Outros subsídios'],
] as const;

const DEDUCTIONS = [
  ['irtOverride', 'IRT (manual)'],
  ['inssOverride', 'INSS colaborador (manual)'],
  ['healthInsurance', 'Seguro de saúde'],
  ['loanDeduction', 'Dedução empréstimo'],
  ['advanceDeduction', 'Adiantamento salarial'],
  ['otherDeductions', 'Outras deduções'],
] as const;

type NumKey = (typeof EARNINGS)[number][0] | (typeof DEDUCTIONS)[number][0];

export function CreatePayslipModal({ onClose, onCreated }: CreatePayslipModalProps) {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<{ id: number; fullName: string } | null>(null);
  const [period, setPeriod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [nums, setNums] = useState<Partial<Record<NumKey, string>>>({});

  const { users, loading } = useDirectoryUsers(
    search,
    '',
    !picked && search.trim().length > 0,
  );

  const create = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post<{ id: number }>('/payslips', body),
    {
      invalidateKeys: [[...queryKeys.payslips.all, 'admin-list']],
      onSuccess: (created) => {
        notify({ title: 'Recibo criado', intent: 'success' });
        onCreated(created.id);
      },
      onError: (e: Error) =>
        notify({
          title:
            (e as { status?: number }).status === 409
              ? 'Recibo desse período já existe para este colaborador'
              : e.message || 'Erro ao criar recibo. Tente novamente.',
          intent: 'danger',
        }),
    },
  );

  const valid =
    !!picked && period.trim() !== '' && paymentDate !== '' && baseSalary.trim() !== '';

  const handleSubmit = () => {
    if (!valid || create.isPending) return;
    const body: Record<string, unknown> = {
      userId: picked!.id,
      period: period.trim(),
      paymentDate,
      baseSalary: Number(baseSalary),
    };
    for (const [key] of [...EARNINGS, ...DEDUCTIONS]) {
      const raw = nums[key];
      if (raw !== undefined && raw.trim() !== '') body[key] = Number(raw);
    }
    if (notes.trim()) body.notes = notes.trim();
    create.mutate(body);
  };

  const setNum = (k: NumKey, v: string) => setNums((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Novo recibo" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="mt-5 space-y-4">
          <FormField label="Colaborador *" htmlFor="cpm-user">
            {picked ? (
              <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                <span className="flex-1 truncate font-body text-sm text-ink">
                  {picked.fullName}
                </span>
                <button
                  type="button"
                  className="font-body text-xs text-primary hover:underline"
                  onClick={() => {
                    setPicked(null);
                    setSearch('');
                  }}
                >
                  alterar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="cpm-user"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar colaborador por nome ou email…"
                  className="w-full"
                  autoComplete="off"
                />
                {search.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {loading && (
                      <div className="px-3 py-2 font-body text-sm text-ink-muted">
                        A pesquisar…
                      </div>
                    )}
                    {!loading && users.length === 0 && (
                      <div className="px-3 py-2 font-body text-sm text-ink-muted">
                        Nenhum colaborador encontrado
                      </div>
                    )}
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setPicked({ id: u.id, fullName: u.fullName })}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <span className="truncate font-body text-sm text-ink">
                          {u.fullName}
                        </span>
                        <span className="ml-auto truncate font-body text-xs text-ink-faint">
                          {u.department?.name ?? u.email ?? ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label="Período *" htmlFor="cpm-period" hint="Formato AAAA-MM">
            <Input
              id="cpm-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-06"
              className="w-full"
            />
          </FormField>
          <FormField label="Data de pagamento *" htmlFor="cpm-pay">
            <Input
              id="cpm-pay"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Salário base *" htmlFor="cpm-base">
            <Input
              id="cpm-base"
              type="number"
              step="any"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="w-full"
            />
          </FormField>

          <button
            type="button"
            className="font-body text-sm text-primary hover:underline"
            onClick={() => setAdvanced((a) => !a)}
          >
            {advanced ? 'Ocultar campos avançados' : 'Mostrar campos avançados'}
          </button>

          {advanced && (
            <div className="grid grid-cols-2 gap-3">
              {[...EARNINGS, ...DEDUCTIONS].map(([key, label]) => (
                <FormField key={key} label={label} htmlFor={`cpm-${key}`}>
                  <Input
                    id={`cpm-${key}`}
                    type="number"
                    step="any"
                    value={nums[key] ?? ''}
                    onChange={(e) => setNum(key, e.target.value)}
                    className="w-full"
                  />
                </FormField>
              ))}
              <div className="col-span-2">
                <FormField label="Notas internas" htmlFor="cpm-notes">
                  <Textarea
                    id="cpm-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full"
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!valid} loading={create.isPending}>
            Criar recibo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
