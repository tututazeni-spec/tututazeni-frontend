// components/processes/AutomationPanel.tsx
// Detalhe de uma regra de automação (docs/Modulo_Processes.md §9): configuração,
// última execução e registo de execuções (com repetição), e teste da regra —
// simulação (por defeito) ou execução única com um payload de exemplo.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { EXECUTION_STATUS_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type { AutomationDetail, AutomationTestResult } from './automation-types';

export interface AutomationPanelProps {
  id: number;
  canManage: boolean;
  onClose: () => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
    <div className="mt-0.5 font-body text-sm text-ink">{children}</div>
  </div>
);

const SAMPLE = `{
  "instanceId": 1,
  "instanceCode": "PROC-2026-0001",
  "priority": "NORMAL",
  "stepTitle": "Validar documentos",
  "assigneeId": 1,
  "targetUserId": 1
}`;

export function AutomationPanel({ id, canManage, onClose }: AutomationPanelProps) {
  const notify = useToast();
  const [payload, setPayload] = useState(SAMPLE);
  const [testResult, setTestResult] = useState<AutomationTestResult | null>(null);

  const { data: r, isLoading, error } = useApiQuery<AutomationDetail>(
    queryKeys.processes.automation(id),
    `/processes/automations/${id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const test = useApiMutation(
    (v: { execute: boolean }) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        throw new Error('O payload de exemplo não é JSON válido');
      }
      return apiClient.post<AutomationTestResult>(`/processes/automations/${id}/test`, {
        payload: parsed,
        execute: v.execute,
      });
    },
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (d) => setTestResult(d),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const rerun = useApiMutation(
    (execId: string) => apiClient.post(`/processes/automations/executions/${execId}/rerun`, {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => notify({ title: 'Execução repetida', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !r) {
    return (
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent title="Regra de automação" className="max-w-3xl">
          {error ? <p className="font-body text-sm text-danger">{error.message}</p> : <Skeleton rows={4} />}
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`${r.code ?? ''} ${r.name}`.trim()}
        description={r.description ?? undefined}
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Evento">{r.triggerLabel}</Field>
          <Field label="Acção">{r.actionLabel}</Field>
          <Field label="Estado">{r.active ? 'Activa' : 'Inactiva'}</Field>
          <Field label="Destinatários">{r.recipients.length ? r.recipients.join(', ') : '—'}</Field>
          <Field label="Prioridade">{r.priority}</Field>
          <Field label="Vigência">
            {r.activeFrom || r.activeUntil ? `${formatDate(r.activeFrom)} → ${formatDate(r.activeUntil)}` : 'Sem limite'}
          </Field>
          <Field label="Tentativas">
            {r.maxRetries ?? 0} · {r.retryPolicy ?? 'NONE'}
            {r.retryDelayMinutes ? ` · ${r.retryDelayMinutes} min` : ''}
          </Field>
          <Field label="Em caso de erro">{r.errorHandling ?? 'LOG'}</Field>
          <Field label="Última execução">
            {r.lastRunAt ? (
              <>
                {formatDateTime(r.lastRunAt)}{' '}
                {r.lastRunStatus && <StatusBadge value={r.lastRunStatus} map={EXECUTION_STATUS_MAP} />}
              </>
            ) : (
              'Nunca'
            )}
          </Field>
        </div>

        {r.conditions && (
          <div className="mt-4">
            <div className="mb-1 font-body text-xs uppercase tracking-wide text-ink-faint">
              Condições ({r.conditions.logic === 'OR' ? 'qualquer' : 'todas'})
            </div>
            <ul className="font-body text-sm text-ink-muted">
              {r.conditions.rows.map((c, i) => (
                <li key={i}>
                  {c.field} {c.operator} {c.value ?? ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {canManage && (
          <div className="mt-5 rounded-card border border-border bg-surface-sunken p-3">
            <h4 className="mb-2 font-body text-sm font-medium text-ink">Testar a regra</h4>
            <FormField label="Payload de exemplo do evento (JSON)" htmlFor="ap-payload">
              <Textarea id="ap-payload" rows={7} value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full font-mono text-xs" />
            </FormField>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button intent="secondary" size="sm" loading={test.isPending} onClick={() => test.mutate({ execute: false })}>
                Simular
              </Button>
              <Button intent="warning" size="sm" loading={test.isPending} onClick={() => test.mutate({ execute: true })}>
                Executar uma vez
              </Button>
            </div>
            {testResult && (
              <div className="mt-3 rounded-card bg-surface p-3 font-body text-sm">
                <p>
                  Condições: <b>{testResult.matches ? 'satisfeitas' : 'não satisfeitas'}</b>
                  {testResult.mode === 'SIMULATION' && (
                    <> · {testResult.wouldRun ? 'a regra correria' : 'a regra não correria'}</>
                  )}
                  {testResult.mode === 'EXECUTION' && (
                    <> · {testResult.executed ? 'executada' : `não executada (${testResult.reason ?? ''})`}</>
                  )}
                </p>
                {testResult.recipients && testResult.recipients.length > 0 && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Destinatários:{' '}
                    {testResult.recipients.map((x) => `${x.token} → ${x.userIds.length ? x.userIds.join(', ') : 'ninguém'}`).join(' · ')}
                  </p>
                )}
                {testResult.result && (
                  <pre className="mt-2 overflow-x-auto rounded bg-surface-sunken p-2 font-mono text-xs">
                    {JSON.stringify(testResult.result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Registo de execuções
          </h4>
          {r.executions.length === 0 && <p className="font-body text-sm text-ink-faint">Sem execuções.</p>}
          <ul className="space-y-2">
            {r.executions.map((e) => (
              <li key={e.id} className="rounded-card border border-border p-2.5">
                <div className="flex flex-wrap items-center gap-2 font-body text-sm text-ink">
                  <StatusBadge value={e.status} map={EXECUTION_STATUS_MAP} variant="dot" />
                  {formatDateTime(e.startedAt)}
                  <span className="text-xs text-ink-faint">tentativa {e.attempt}</span>
                  {e.nextRetryAt && (
                    <span className="text-xs text-warning-ink">nova tentativa {formatDateTime(e.nextRetryAt)}</span>
                  )}
                  {canManage && e.status === 'FAILED' && (
                    <Button intent="ghost" size="sm" className="ml-auto" loading={rerun.isPending} onClick={() => rerun.mutate(e.id)}>
                      Repetir
                    </Button>
                  )}
                </div>
                {e.errorMessage && <p className="mt-1 font-body text-xs text-danger">{e.errorMessage}</p>}
                {Object.keys(e.result).length > 0 && (
                  <p className="mt-1 font-mono text-xs text-ink-muted">{JSON.stringify(e.result)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
