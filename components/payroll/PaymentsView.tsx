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
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { fmtPeriodNumeric } from '@/components/payslips/format';
import { RunPicker } from './RunPicker';
import {
  PAYMENT_NEXT,
  PAYMENT_STATUS_MAP,
  type PaymentStatus,
  type PayrollPayment,
} from './insightTypes';

const TH =
  'px-2 py-3 font-body text-xs font-bold uppercase leading-tight tracking-wide text-white';
const TD = 'px-2 py-3 text-white';

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
  const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PaymentsView() {
  const notify = useToast();
  const [period, setPeriod] = useState('');
  // Só o cabeçalho até o utilizador mexer num filtro.
  const [filtered, setFiltered] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [bankName, setBankName] = useState('');
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
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setFiltered(true);
          }}
          placeholder="Período (AAAA-MM)"
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
        <div className="overflow-hidden rounded-[14px] border border-[#1E3A66] bg-[#071D3B] shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
          <table className="w-full text-left font-body text-xs">
            <thead className="bg-[#0B2D5B]">
              <tr>
                <th className={TH}>Período</th>
                <th className={TH}>Banco</th>
                <th className={TH}>Conta</th>
                <th className={TH}>Colab.</th>
                <th className={`${TH} text-right`}>Valor total</th>
                <th className={TH}>Prevista</th>
                <th className={TH}>Efectiva</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Referência</th>
                <th className={TH}>Responsável</th>
                <th className={TH}>Acções</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#6F8FB8]/20 align-top transition-colors duration-150 last:border-0 hover:bg-white/5"
                >
                  <td className={`${TD} font-mono`}>{fmtPeriodNumeric(p.period)}</td>
                  <td className={`${TD} text-[#CFE3FF]`}>
                    {p.bankName ?? '—'}
                  </td>
                  <td className={`${TD} text-[#CFE3FF]`}>
                    {p.paymentAccount ?? '—'}
                  </td>
                  <td className={TD}>{p.employeeCount}</td>
                  <td className={`${TD} text-right font-mono`}>
                    {fmtKz(p.totalAmount)}
                  </td>
                  <td className={`${TD} text-[#CFE3FF]`}>
                    {p.expectedDate ? fmtDate(p.expectedDate) : '—'}
                  </td>
                  <td className={`${TD} text-[#CFE3FF]`}>
                    {p.effectiveDate ? fmtDate(p.effectiveDate) : '—'}
                  </td>
                  <td className={TD}>
                    <StatusBadge
                      value={p.status}
                      map={PAYMENT_STATUS_MAP}
                      variant="dot"
                    />
                    {p.errorMessage && (
                      <div className="mt-1 max-w-[220px] text-xs text-[#FFB4B4]">
                        {p.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className={`${TD} font-mono text-xs text-[#CFE3FF]`}>
                    {p.reference ?? '—'}
                  </td>
                  <td className={`${TD} text-[#CFE3FF]`}>
                    {p.responsibleName ?? '—'}
                  </td>
                  <td className={TD}>
                    <div className="flex flex-wrap gap-1.5">
                      {!['CANCELLED', 'FAILED'].includes(p.status) && (
                        <Button
                          size="sm"
                          intent="secondary"
                          loading={
                            bankFile.isPending && bankFile.variables === p.id
                          }
                          onClick={() => bankFile.mutate(p.id)}
                        >
                          Ficheiro bancário
                        </Button>
                      )}
                      {PAYMENT_NEXT[p.status].map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          intent={
                            next === 'CANCELLED' || next === 'FAILED'
                              ? 'ghost'
                              : 'primary'
                          }
                          className={
                            next === 'CANCELLED' || next === 'FAILED'
                              ? 'text-white hover:bg-white/10'
                              : undefined
                          }
                          disabled={setStatus.isPending}
                          onClick={() => onAction(p, next)}
                        >
                          {ACTION_LABEL[next]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <Input
                  id="pay-bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </FormField>
              <FormField label="Conta de pagamento" htmlFor="pay-acc">
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
