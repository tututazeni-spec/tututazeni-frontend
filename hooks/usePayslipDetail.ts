// hooks/usePayslipDetail.ts
// Container do detalhe de um recibo salarial — dados (query + mutação de
// confirmação) e o fluxo de disputa (reducer + submissão). Extraído de
// DetailView em app/(platform)/payslips/page.tsx (434 linhas, misturava
// isto tudo com o JSX do recibo). A vista apresentacional
// (components/payslips/PayslipDetailView.tsx) não sabe nada disto — só
// recebe o resultado por props.
// Ver memory project_innova_component_separation_audit, item 3.2.

'use client';

import { useReducer } from 'react';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Payslip } from '@/components/payslips/types';

// Reducer em vez de vários useState porque as transições são interdependentes
// (ex: fechar o modal de disputa tem de limpar reason/details ao mesmo tempo
// que muda `open`) — com useState separados seria fácil deixar um campo
// desincronizado (ex: fechar sem limpar o texto do motivo).
export type DisputeState =
  | { open: false }
  | { open: true; reason: string; details: string; submitting: boolean };

export type DisputeAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_REASON'; reason: string }
  | { type: 'SET_DETAILS'; details: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' };

function disputeReducer(
  state: DisputeState,
  action: DisputeAction,
): DisputeState {
  switch (action.type) {
    case 'OPEN':
      return { open: true, reason: '', details: '', submitting: false };
    case 'CLOSE':
      return { open: false };
    case 'SET_REASON':
      return state.open ? { ...state, reason: action.reason } : state;
    case 'SET_DETAILS':
      return state.open ? { ...state, details: action.details } : state;
    case 'SUBMIT_START':
      return state.open ? { ...state, submitting: true } : state;
    case 'SUBMIT_END':
      return state.open ? { ...state, submitting: false } : state;
  }
}

export function usePayslipDetail(payslipId: number) {
  const notify = useToast();
  const {
    data: payslip,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<Payslip>(
    queryKeys.payslips.detail(payslipId),
    `/payslips/my/${payslipId}`,
    { enabled: !!payslipId, staleTime: STALE_TIME.DYNAMIC },
  );
  const error = queryError?.message ?? null;

  const acknowledgeMutation = useApiMutation(
    () => apiClient.patch(`/payslips/my/${payslipId}/acknowledge`, {}),
    {
      invalidateKeys: [queryKeys.payslips.detail(payslipId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const acknowledging = acknowledgeMutation.isPending;
  const acknowledge = () => {
    if (!payslip || payslip.status === 'ACKNOWLEDGED') return;
    acknowledgeMutation.mutate(undefined);
  };

  const [dispute, dispatchDispute] = useReducer(disputeReducer, {
    open: false,
  });

  const submitDispute = async () => {
    if (!dispute.open || !dispute.reason.trim()) return;
    dispatchDispute({ type: 'SUBMIT_START' });
    try {
      await apiClient.post(`/payslips/my/${payslipId}/dispute`, {
        reason: dispute.reason,
        details: dispute.details,
      });
      dispatchDispute({ type: 'CLOSE' });
      notify({
        title: 'Disputa registada com sucesso. O RH será notificado.',
        intent: 'success',
      });
    } catch (e) {
      reportError(e, { source: 'usePayslipDetail.submitDispute' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
      dispatchDispute({ type: 'SUBMIT_END' });
    }
  };

  return {
    payslip,
    loading,
    error,
    acknowledging,
    acknowledge,
    dispute,
    dispatchDispute,
    submitDispute,
  };
}
