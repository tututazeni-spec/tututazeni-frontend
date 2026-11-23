// components/payroll/PaymentsView.tsx
// Pagamentos (docs/payroll.md §7): passagem da folha processada para
// pagamento. Lista, novo pagamento por run, transições de estado,
// ficheiro bancário (CSV) e consulta de erros.
'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ANGOLAN_BANKS, BANK_OTHER } from '@/lib/angolanBanks';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { fmtPeriodNumeric } from '@/components/payslips/format';
import { RunPicker } from './RunPicker';
import { PaymentCard } from './PaymentCard';
import { Download } from 'lucide-react';
import {
  PAYMENT_NEXT,
  PAYMENT_STATUS_MAP,
  type PaymentStatus,
  type PayrollPayment,
} from './insightTypes';
import { saveBlob } from '@/lib/download';

function Field({
  label,
  children,
  strong,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd
        className={`mt-0.5 break-words font-body text-ink ${
          strong ? 'text-lg font-bold' : 'text-sm'
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

const ACTION_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Reabrir',
  PREPARED: 'Marcar preparado',
  SENT_TO_BANK: 'Enviado ao banco',
  PROCESSED: 'Processado',
  PAID: 'Marcar como pago',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelar',
};

interface BankFile {
  filename: string;
  content: string;
  rows: number;
  missingNib: string[];
}

function downloadCsv(file: BankFile) {
  const blob = new Blob(['﻿', file.content], {
    type: 'text/csv;charset=utf-8',
  });
  saveBlob(blob, file.filename);
}

export function PaymentsView() {
  const notify = useToast();
  const [period, setPeriod] = useState('');
  // Só o cabeçalho até o utilizador mexer num filtro.
  const [filtered, setFiltered] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [bankName, setBankName] = useState('');
  // Banco escolhido na lista ('' = nenhum, BANK_OTHER = escrever outro).
  const [bankChoice, setBankChoice] = useState('');
  const [account, setAccount] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [failing, setFailing] = useState<PayrollPayment | null>(null);
  const [reason, setReason] = useState('');

  const params: Record<string, string> = {};
  if (period.trim()) params.period = period.trim();

  const { data, isLoading, error } = useApiQuery<PayrollPayment[]>(
    queryKeys.payroll.section('payments', params),
    '/payroll/payments',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const create = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post<PayrollPayment>('/payroll/payments', body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Pagamento criado', intent: 'success' });
        setCreating(false);
        setRunId(null);
        setBankName('');
        setBankChoice('');
        setAccount('');
        setExpectedDate('');
      },
    },
  );

  const setStatus = useApiMutation(
    (v: { id: number; status: PaymentStatus; errorMessage?: string }) =>
      apiClient.patch<PayrollPayment>(`/payroll/payments/${v.id}/status`, {
        status: v.status,
        errorMessage: v.errorMessage,
      }),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Estado actualizado', intent: 'success' });
        setFailing(null);
        setReason('');
      },
    },
  );

  const bankFile = useApiMutation(
    (id: number) =>
      apiClient.get<BankFile>(`/payroll/payments/${id}/bank-file`),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: (file) => {
        downloadCsv(file);
        notify({
          title: `Ficheiro gerado (${file.rows} linhas)`,
          description: file.missingNib.length
            ? `Sem NIB: ${file.missingNib.join(', ')}`
            : undefined,
          intent: file.missingNib.length ? 'info' : 'success',
        });
      },
    },
  );

  const onAction = (p: PayrollPayment, status: PaymentStatus) => {
    if (status === 'FAILED') {
      setFailing(p);
      return;
    }
    setStatus.mutate({ id: p.id, status });
  };

  const rows = filtered ? (data ?? []) : [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="month"
          variant="underline"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setFiltered(true);
          }}
          aria-label="Período (mês e ano)"
          className="w-44"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          + Novo pagamento
        </Button>
      </div>

      {filtered && isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {filtered && !isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Sem pagamentos"
          description="Crie um pagamento a partir de um processamento aprovado ou publicado."
        />
      )}

      {!error && (
        <div className="space-y-4">
          {rows.map((p) => (
            <PaymentCard
              key={p.id}
              payment={p}
              actions={
                <>
                  {!['CANCELLED', 'FAILED'].includes(p.status) && (
                    <Button
                      size="sm"
                      intent="secondary"
                      className="w-full !rounded-full !border-[1.5px] !border-[#0F1F3D] !bg-white !text-[#0F1F3D] hover:!bg-[#0F1F3D] hover:!text-white"
                      loading={
                        bankFile.isPending && bankFile.variables === p.id
                      }
                      onClick={() => bankFile.mutate(p.id)}
                    >
                      <Download size={15} strokeWidth={1.75} />
                      Ficheiro bancário
                    </Button>
                  )}
                  {PAYMENT_NEXT[p.status].map((next) => {
                    const secondary = next === 'CANCELLED' || next === 'FAILED';
                    return (
                      <Button
                        key={next}
                        size="sm"
                        intent={secondary ? 'ghost' : 'primary'}
                        className={
                          secondary
                            ? 'w-full !rounded-full !text-[#0F1F3D] hover:!bg-[#0F1F3D]/10'
                            : 'w-full !rounded-full !bg-[#0F1F3D] !text-white hover:!bg-black'
                        }
                        disabled={setStatus.isPending}
                        onClick={() => onAction(p, next)}
                      >
                        {ACTION_LABEL[next]}
                      </Button>
                    );
                  })}
                </>
              }
            />
          ))}
        </div>
      )}

      {creating && (
        <Modal open onOpenChange={(open) => !open && setCreating(false)}>
          <ModalContent title="Novo pagamento" className="max-w-md">
            <div className="mt-5 space-y-4">
              <FormField label="Processamento *" htmlFor="pay-run">
                <RunPicker
                  value={runId}
                  onChange={setRunId}
                  className="w-full"
                />
              </FormField>
              <FormField label="Banco" htmlFor="pay-bank">
                <Select
                  items={[
                    { value: 'none', label: 'Seleccionar banco' },
                    ...ANGOLAN_BANKS.map((b) => ({
                      value: b.name,
                      label: `${b.name} (${b.short})`,
                    })),
                    { value: BANK_OTHER, label: 'Outro banco…' },
                  ]}
                  value={bankChoice || 'none'}
                  onValueChange={(v) => {
                    const choice = v === 'none' ? '' : v;
                    setBankChoice(choice);
                    setBankName(
                      choice === BANK_OTHER || choice === '' ? '' : choice,
                    );
                  }}
                  className="w-full"
                />
                {bankChoice === BANK_OTHER && (
                  <Input
                    id="pay-bank"
                    className="mt-2 w-full"
                    placeholder="Nome do banco"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                )}
              </FormField>
              <FormField
                label="Conta de pagamento"
                htmlFor="pay-acc"
                hint="NIB/IBAN da conta da empresa"
              >
                <Input
                  id="pay-acc"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </FormField>
              <FormField label="Data prevista" htmlFor="pay-date">
                <Input
                  id="pay-date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button intent="ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={runId === null}
                  loading={create.isPending}
                  onClick={() =>
                    create.mutate({
                      runId,
                      bankName: bankName.trim() || undefined,
                      paymentAccount: account.trim() || undefined,
                      expectedDate: expectedDate || undefined,
                    })
                  }
                >
                  Criar
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}

      {failing && (
        <Modal open onOpenChange={(open) => !open && setFailing(null)}>
          <ModalContent
            title="Marcar pagamento como falhado"
            className="max-w-md"
          >
            <div className="mt-5 space-y-4">
              <FormField label="Motivo da falha *" htmlFor="pay-reason">
                <Textarea
                  id="pay-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button intent="ghost" onClick={() => setFailing(null)}>
                  Cancelar
                </Button>
                <Button
                  intent="danger"
                  disabled={!reason.trim()}
                  loading={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate({
                      id: failing.id,
                      status: 'FAILED',
                      errorMessage: reason.trim(),
                    })
                  }
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
