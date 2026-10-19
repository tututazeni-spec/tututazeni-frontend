// components/certificates/BatchIssueModal.tsx
// Emissão em lote para "todos os elegíveis" de um curso ou evento. O backend
// valida cada titular à parte; aqui mostra-se o resultado por titular.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';

interface BatchRow {
  userId: number;
  outcome:
    | 'ISSUED'
    | 'EXISTS'
    | 'PENDING_APPROVAL'
    | 'NOT_ELIGIBLE'
    | 'NO_RULE'
    | 'ERROR';
  missing?: string[];
  error?: string;
}

interface BatchResult {
  total: number;
  issued: number;
  existing: number;
  failed: number;
  results: BatchRow[];
}

const OUTCOME_LABEL: Record<BatchRow['outcome'], string> = {
  ISSUED: 'Emitido',
  PENDING_APPROVAL: 'Aguarda aprovação',
  EXISTS: 'Já tinha certificado',
  NOT_ELIGIBLE: 'Requisitos por cumprir',
  NO_RULE: 'Sem regra de emissão',
  ERROR: 'Não foi possível emitir',
};

const KIND_ITEMS = [
  { value: 'COURSE', label: 'Curso' },
  { value: 'EVENT', label: 'Evento' },
];

export function BatchIssueModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<'COURSE' | 'EVENT'>('COURSE');
  const [activityId, setActivityId] = useState('');
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listParams = { limit: 100 };
  const activities = useApiQuery<{ data: { id: number; title: string }[] }>(
    [...queryKeys.certificates.all, 'activities', kind],
    kind === 'COURSE' ? '/courses' : '/events',
    { params: listParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const items = (activities.data?.data ?? []).map((a) => ({
    value: String(a.id),
    label: a.title,
  }));

  const run = useApiMutation(
    () =>
      apiClient.post<BatchResult>('/certificates/issue-batch', {
        activityKind: kind,
        activityId: Number(activityId),
        allEligible: true,
      }),
    {
      invalidateKeys: [
        queryKeys.certificates.all,
        queryKeys.courses.myCertificates(),
      ],
      onSuccess: (r) => {
        setError(null);
        setResult(r);
      },
      onError: (e) => setError(e.message),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Emitir em lote"
        description="Emite o certificado a todos os que concluíram (cursos) ou estiveram presentes (eventos). Cada titular é validado individualmente."
        navyHeader
      >
        <div className="space-y-4">
          {error && (
            <AlertCard
              variant="danger"
              title="Não foi possível emitir o lote"
              message={error}
              compact
            />
          )}

          {!result ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Aplica-se a" htmlFor="batch-kind">
                  <Select
                    items={KIND_ITEMS}
                    value={kind}
                    onValueChange={(v) => {
                      setKind(v as 'COURSE' | 'EVENT');
                      setActivityId('');
                    }}
                  />
                </FormField>
                <FormField label="Atividade" htmlFor="batch-activity">
                  <Select
                    items={items}
                    value={activityId}
                    onValueChange={setActivityId}
                    placeholder="Escolher…"
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-2">
                <Button intent="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => run.mutate(undefined)}
                  disabled={!activityId || run.isPending}
                >
                  {run.isPending ? 'A emitir…' : 'Emitir a todos os elegíveis'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink">
                <strong>{result.issued}</strong> emitidos ·{' '}
                <strong>{result.existing}</strong> já tinham certificado ·{' '}
                <strong>{result.failed}</strong> não emitidos (de {result.total}
                ).
              </p>
              {result.failed > 0 && (
                <ul className="max-h-56 space-y-1 overflow-y-auto text-sm text-ink">
                  {result.results
                    .filter(
                      (r) =>
                        !['ISSUED', 'EXISTS', 'PENDING_APPROVAL'].includes(
                          r.outcome,
                        ),
                    )
                    .map((r) => (
                      <li key={r.userId}>
                        Colaborador #{r.userId}: {OUTCOME_LABEL[r.outcome]}
                        {r.missing?.length ? ` — ${r.missing.join('; ')}` : ''}
                        {r.error ? ` — ${r.error}` : ''}
                      </li>
                    ))}
                </ul>
              )}
              <div className="flex justify-end">
                <Button onClick={onClose}>Fechar</Button>
              </div>
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
