// components/certificates/ReconcilePathsModal.tsx
// Retroativos das trilhas: primeiro simula (nada é emitido) e só depois, com
// confirmação, emite os certificados de quem já cumpriu todas as unidades obrigatórias.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useLearningPathOptions } from '@/components/users/createUserData';

interface ReconcileReport {
  dryRun: boolean;
  checked: number;
  eligible: number;
  issued: number;
  items: {
    userId: number;
    learningPathId: number;
    outcome: 'ELIGIBLE' | 'ISSUED' | 'SKIPPED' | 'ERROR';
  }[];
}

const URL = '/certificates/reconcile-learning-paths';
const ALL = 'ALL';

function reconcileUrl(pathId: string, dryRun: boolean): string {
  const qs = new URLSearchParams();
  if (pathId !== ALL) qs.set('learningPathId', pathId);
  if (!dryRun) qs.set('dryRun', 'false');
  const q = qs.toString();
  return q ? `${URL}?${q}` : URL;
}

export function ReconcilePathsModal({ onClose }: { onClose: () => void }) {
  const [report, setReport] = useState<ReconcileReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pathId, setPathId] = useState(ALL);
  const { options } = useLearningPathOptions();
  const pathItems = [
    { value: ALL, label: 'Todas as trilhas' },
    ...options.map((o) => ({ value: o.value, label: o.label })),
  ];

  const simulate = useApiMutation(
    () => apiClient.post<ReconcileReport>(reconcileUrl(pathId, true), {}),
    {
      onSuccess: (r) => {
        setError(null);
        setReport(r);
      },
      onError: (e) => setError(e.message),
    },
  );
  const issue = useApiMutation(
    () => apiClient.post<ReconcileReport>(reconcileUrl(pathId, false), {}),
    {
      invalidateKeys: [queryKeys.certificates.all],
      onSuccess: (r) => {
        setError(null);
        setReport(r);
      },
      onError: (e) => setError(e.message),
    },
  );

  const skipped = report?.items.filter((i) => i.outcome === 'SKIPPED').length;
  const failed = report?.items.filter((i) => i.outcome === 'ERROR').length;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Reconciliar trilhas"
        description="Encontra quem já cumpriu todas as unidades obrigatórias de uma trilha e ainda não tem certificado. Primeiro faz uma simulação; nada é emitido até confirmar."
        navyHeader
      >
        <div className="space-y-4">
          {error && (
            <AlertCard
              variant="danger"
              title="Não foi possível reconciliar as trilhas"
              message={error}
              compact
            />
          )}

          <FormField label="Trilha" htmlFor="reconcile-path">
            <Select
              items={pathItems}
              value={pathId}
              onValueChange={(v) => {
                setPathId(v);
                // A simulação deixa de valer: obriga a simular outra vez antes de emitir.
                setReport(null);
              }}
              disabled={issue.isPending || report?.dryRun === false}
            />
          </FormField>

          {report && (
            <p className="text-sm text-ink">
              {report.dryRun ? (
                <>
                  Simulação: <strong>{report.eligible}</strong> certificados
                  seriam emitidos
                  {skipped
                    ? ` · ${skipped} já tinham certificado`
                    : ''} (de {report.checked} inscrições por concluir).
                </>
              ) : (
                <>
                  <strong>{report.issued}</strong> certificados emitidos (de{' '}
                  {report.checked} inscrições por concluir)
                  {failed ? ` · ${failed} com erro` : ''}.
                </>
              )}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              {report && !report.dryRun ? 'Fechar' : 'Cancelar'}
            </Button>
            {(!report || report.dryRun) && (
              <Button
                intent={report ? 'secondary' : 'primary'}
                onClick={() => simulate.mutate(undefined)}
                disabled={simulate.isPending || issue.isPending}
              >
                {simulate.isPending ? 'A simular…' : 'Simular'}
              </Button>
            )}
            {report?.dryRun && report.eligible > 0 && (
              <Button
                onClick={() => issue.mutate(undefined)}
                disabled={issue.isPending}
              >
                {issue.isPending
                  ? 'A emitir…'
                  : `Emitir ${report.eligible} certificados`}
              </Button>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
