// components/payslips/CompensationFormModal.tsx
// Criar / corrigir um registo de EmployeeCompensation.
//  - create sem userId  → pesquisa de colaborador (obrigatória)
//  - create com userId   → colaborador fixo (só-leitura)
//  - edit                → sem campo de colaborador; PUT /payroll/compensation/:id (body sem userId)
// create: POST /payroll/compensation fecha automaticamente a versão anterior.
// IBAN em claro é intencional (mesma política dos endpoints current/history).
'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useDirectoryUsers, type DirectoryUser } from './compensationData';
import type { EmployeeCompensation } from './types';

export interface CompensationFormModalProps {
  mode: 'create' | 'edit';
  record?: EmployeeCompensation | null;
  userId?: number;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));

export function CompensationFormModal({
  mode,
  record,
  userId,
  onClose,
}: CompensationFormModalProps) {
  const editing = mode === 'edit';
  const notify = useToast();

  const fixedName = record?.user?.fullName;
  const [rawSearch, setRawSearch] = useState('');
  const [picked, setPicked] = useState<DirectoryUser | null>(null);
  const { users, loading: usersLoading } = useDirectoryUsers(
    rawSearch,
    '',
    !editing && userId == null && !picked && rawSearch.trim().length > 0,
  );

  // create-com-record ("Nova versão"): os dados bancários / subsídios são
  // herdados do registo actual (senão o POST escreve-os null e degrada o
  // pagamento), mas o salário base fica em branco de propósito — uma nova
  // versão implica uma cifra nova e deliberada. `editing` continua a ser
  // mode === 'edit'; isto NÃO é edição.
  const [baseSalary, setBaseSalary] = useState(
    editing && record?.baseSalary != null ? String(record.baseSalary) : '',
  );
  const [foodAllowance, setFoodAllowance] = useState(
    record?.foodAllowance != null ? String(record.foodAllowance) : '',
  );
  const [transportAllowance, setTransportAllowance] = useState(
    record?.transportAllowance != null ? String(record.transportAllowance) : '',
  );
  const [bankName, setBankName] = useState(record?.bankName ?? '');
  const [iban, setIban] = useState(record?.iban ?? '');
  const [accountNumber, setAccountNumber] = useState(
    record?.accountNumber ?? '',
  );
  const [countryCode, setCountryCode] = useState(record?.countryCode ?? 'AO');
  const [effectiveFrom, setEffectiveFrom] = useState(
    editing ? (record?.effectiveFrom ?? '').slice(0, 10) : today(),
  );
  const [submitError, setSubmitError] = useState('');

  const resolvedUserId = editing ? undefined : (userId ?? picked?.id);
  const baseValid =
    baseSalary.trim() !== '' &&
    Number(baseSalary) >= 0 &&
    (editing || resolvedUserId != null);

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/payroll/compensation/${record!.id}`, body)
        : apiClient.post('/payroll/compensation', body),
    {
      invalidateKeys: [queryKeys.payslips.all],
      onSuccess: () => {
        notify({
          title: editing ? 'Registo corrigido' : 'Compensação criada',
          intent: 'success',
        });
        onClose();
      },
      onError: (e: Error) =>
        setSubmitError(e.message || 'Erro ao guardar. Tente novamente.'),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!baseValid || loading) return;
    setSubmitError('');
    const body: Record<string, unknown> = {
      baseSalary: Number(baseSalary),
      foodAllowance: numOrNull(foodAllowance),
      transportAllowance: numOrNull(transportAllowance),
      bankName: bankName.trim() || null,
      iban: iban.trim() || null,
      accountNumber: accountNumber.trim() || null,
      countryCode: countryCode.trim() || 'AO',
      effectiveFrom,
    };
    if (!editing) body.userId = resolvedUserId;
    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Corrigir registo de compensação' : 'Nova compensação'}
        description={
          editing
            ? undefined
            : 'A versão anterior deste colaborador é fechada automaticamente.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {editing && (
            <div className="flex items-start gap-2 rounded-card bg-warning-subtle p-3 text-sm text-warning-ink">
              <AlertCircle size={16} strokeWidth={1.75} className="mt-0.5" />
              <span>
                Isto corrige este registo no lugar — não cria uma nova versão
                nem mexe no histórico. Para uma mudança salarial com data, usa
                “Nova versão”.
              </span>
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {!editing && (
            <FormField label="Colaborador *" htmlFor="cfm-user">
              {userId != null || picked ? (
                <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                  <span className="flex-1 truncate text-sm text-ink">
                    {picked?.fullName ?? fixedName ?? `#${userId}`}
                  </span>
                  {picked && userId == null && (
                    <button
                      type="button"
                      aria-label="Remover colaborador"
                      onClick={() => setPicked(null)}
                      className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                    >
                      <X size={16} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="cfm-user"
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    placeholder="Pesquisar colaborador por nome ou email…"
                    className="w-full"
                    autoComplete="off"
                  />
                  {rawSearch.trim().length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                      {usersLoading && (
                        <div className="px-3 py-2 text-sm text-ink-muted">
                          A pesquisar…
                        </div>
                      )}
                      {!usersLoading && users.length === 0 && (
                        <div className="px-3 py-2 text-sm text-ink-muted">
                          Nenhum colaborador encontrado
                        </div>
                      )}
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setPicked(u);
                            setRawSearch('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                        >
                          <span className="truncate text-sm text-ink">
                            {u.fullName}
                          </span>
                          <span className="ml-auto truncate text-xs text-ink-faint">
                            {u.department?.name ?? u.email ?? ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Salário base (Kz) *" htmlFor="cfm-base">
              <Input
                id="cfm-base"
                type="number"
                step="any"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Em vigor desde"
              htmlFor="cfm-eff"
              hint={
                editing
                  ? undefined
                  : 'A versão anterior é fechada automaticamente.'
              }
            >
              <Input
                id="cfm-eff"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Subsídio de alimentação" htmlFor="cfm-food">
              <Input
                id="cfm-food"
                type="number"
                step="any"
                value={foodAllowance}
                onChange={(e) => setFoodAllowance(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Subsídio de transporte" htmlFor="cfm-transport">
              <Input
                id="cfm-transport"
                type="number"
                step="any"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Banco" htmlFor="cfm-bank">
              <Input
                id="cfm-bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="IBAN" htmlFor="cfm-iban">
              <Input
                id="cfm-iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full font-mono"
              />
            </FormField>
            <FormField label="Nº de conta" htmlFor="cfm-acc">
              <Input
                id="cfm-acc"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="País" htmlFor="cfm-country">
              <Input
                id="cfm-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!baseValid}
            loading={loading}
          >
            {editing ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
