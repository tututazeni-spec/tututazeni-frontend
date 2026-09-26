// components/roi-impact/NewCorrelationModal.tsx
// "Nova Análise" de Correlações (docs/roi-impact.md §7) — escolhe uma das 7
// análises predefinidas no spec e um período opcional; o coeficiente e a
// significância são sempre calculados no backend a partir de dados reais
// (nunca introduzidos à mão aqui).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type { CorrelationDefinition, CorrelationType } from './types';

export interface NewCorrelationModalProps {
  initialType?: CorrelationType;
  onClose: () => void;
}

export function NewCorrelationModal({ initialType, onClose }: NewCorrelationModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');
  const [type, setType] = useState<CorrelationType | ''>(initialType ?? '');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const { data: definitions } = useApiQuery<CorrelationDefinition[]>(
    queryKeys.roiImpact.correlationDefinitions(),
    '/roi-impact/correlations/definitions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const run = useApiMutation(
    () =>
      apiClient.post('/roi-impact/correlations', {
        type,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
      }),
    {
      invalidateKeys: [queryKeys.roiImpact.correlations()],
      onSuccess: () => {
        notify({ title: 'Análise de correlação executada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao executar a análise.'),
    },
  );

  const selected = definitions?.find((d) => d.type === type);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Análise de Correlação"
        description="Relações estatísticas entre desenvolvimento e resultados de negócio — docs/roi-impact.md §7"
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <FormField label="Análise *" htmlFor="corr-type">
            <Select
              items={(definitions ?? []).map((d) => ({ value: d.type, label: d.label }))}
              value={type}
              onValueChange={(v) => setType(v as CorrelationType)}
              placeholder="Selecionar…"
              className="w-full"
            />
          </FormField>

          {selected && <p className="font-body text-xs text-ink-faint">{selected.description}</p>}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Período — de" htmlFor="corr-period-start">
              <Input
                id="corr-period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Período — até" htmlFor="corr-period-end">
              <Input
                id="corr-period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <p className="rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-faint">
            Correlação não implica causalidade — leitura interpretativa, nunca automática. Esta
            aba é analítica e de apoio à decisão; não deve alimentar automações sem validação
            humana.
          </p>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="justify-center" onClick={onClose} disabled={run.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => run.mutate(undefined)}
            loading={run.isPending}
            disabled={!type}
          >
            Executar análise
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
