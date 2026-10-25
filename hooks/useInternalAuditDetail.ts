// hooks/useInternalAuditDetail.ts
// Detalhe de uma auditoria interna: query, fase do fluxo, estado dos
// formulários inline e todas as mutações (verificações, evidências,
// constatações, ações, estado, aprovação, exportação).
// Extraído de components/audit/AuditsView.tsx (AuditModal tinha 9 mutações no
// mesmo corpo que o JSX).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { saveBlob } from '@/lib/download';
import { useToast } from '@/providers/ToastProvider';
import type { DirectoryUser } from '@/components/users/types';
import type {
  InternalAuditDetail,
  InternalAuditStatus,
} from '@/components/audit/types';
import {
  EMPTY_DETAIL_FORM,
  auditPhase,
  buildActionPayload,
  buildApprovePayload,
  buildCheckPayload,
  buildEvidencePayload,
  buildFindingPayload,
  clearDetailFields,
  isDetailFormValid,
  type DetailFormValues,
  type FormKind,
} from '@/components/audit/audits/logic';

export function useInternalAuditDetail(auditId: number) {
  const notify = useToast();
  const { data: audit } = useApiQuery<InternalAuditDetail>(
    queryKeys.audit.auditDetail(auditId),
    `/audit/audits/${auditId}`,
    { staleTime: STALE_TIME.REALTIME },
  );

  const [form, setForm] = useState<FormKind>(null);
  const [f, setF] = useState<DetailFormValues>(EMPTY_DETAIL_FORM);
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);
  const set = (patch: Partial<DetailFormValues>) =>
    setF((x) => ({ ...x, ...patch }));

  const closeForm = () => setForm(null);
  const toggle = (k: Exclude<FormKind, null>) =>
    setForm((cur) => (cur === k ? null : k));

  const done = () => {
    setForm(null);
    setResponsible(null);
    setF(clearDetailFields);
  };
  const opts = {
    invalidateKeys: [queryKeys.audit.all],
    onSuccess: () => {
      done();
      notify({ title: 'Guardado', intent: 'success' });
    },
    onError: (e: Error) =>
      notify({
        title: 'Não foi possível concluir',
        description: e.message,
        intent: 'danger',
      }),
  };
  // Alterar o estado de uma linha não fecha o formulário em curso.
  const inlineOpts = { ...opts, onSuccess: () => undefined };
  const base = `/audit/audits/${auditId}`;

  const addCheck = useApiMutation(
    () => apiClient.post(`${base}/checks`, buildCheckPayload(f)),
    opts,
  );
  const updateCheck = useApiMutation(
    (v: { id: number; status: string }) =>
      apiClient.patch(`${base}/checks/${v.id}`, { status: v.status }),
    inlineOpts,
  );
  const addEvidence = useApiMutation(
    () => apiClient.post(`${base}/evidences`, buildEvidencePayload(f)),
    opts,
  );
  const addFinding = useApiMutation(
    () => apiClient.post(`${base}/findings`, buildFindingPayload(f)),
    opts,
  );
  const addAction = useApiMutation(
    () =>
      apiClient.post(`${base}/actions`, buildActionPayload(f, responsible?.id)),
    opts,
  );
  const updateAction = useApiMutation(
    (v: { id: number; status: string }) =>
      apiClient.patch(`${base}/actions/${v.id}`, { status: v.status }),
    inlineOpts,
  );
  const changeStatus = useApiMutation(
    (v: { status: InternalAuditStatus; reason?: string }) =>
      apiClient.post(`${base}/status`, v),
    opts,
  );
  const approve = useApiMutation(
    () => apiClient.post(`${base}/approve`, buildApprovePayload(f)),
    opts,
  );
  const exportReport = useApiMutation(
    () =>
      apiClient.get<{ filename: string; content: string }>(`${base}/export`),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: ({ filename, content }) => {
        saveBlob(
          new Blob([content], { type: 'text/markdown;charset=utf-8' }),
          filename,
        );
      },
      onError: opts.onError,
    },
  );

  return {
    audit,
    phase: auditPhase(audit?.status),
    form,
    f,
    set,
    responsible,
    setResponsible,
    toggle,
    closeForm,
    /** O formulário aberto tem o campo obrigatório preenchido. */
    formValid: isDetailFormValid(form, f),
    submit: {
      check: () => addCheck.mutate(undefined),
      evidence: () => addEvidence.mutate(undefined),
      finding: () => addFinding.mutate(undefined),
      action: () => addAction.mutate(undefined),
      approve: () => approve.mutate(undefined),
      cancel: () =>
        changeStatus.mutate({ status: 'CANCELLED', reason: f.reason }),
    },
    changeStatus: (status: InternalAuditStatus) =>
      changeStatus.mutate({ status }),
    updateCheckStatus: (id: number, status: string) =>
      updateCheck.mutate({ id, status }),
    updateActionStatus: (id: number, status: string) =>
      updateAction.mutate({ id, status }),
    exportReport: () => exportReport.mutate(undefined),
    pending: {
      check: addCheck.isPending,
      evidence: addEvidence.isPending,
      finding: addFinding.isPending,
      action: addAction.isPending,
      approve: approve.isPending,
      status: changeStatus.isPending,
      export: exportReport.isPending,
    },
  };
}

export type InternalAuditDetailController = ReturnType<
  typeof useInternalAuditDetail
>;
