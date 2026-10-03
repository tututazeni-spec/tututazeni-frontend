// components/processes/TemplateValidationModal.tsx
// «Testar o fluxo» (§5/§8): valida o grafo de etapas do modelo (ciclos,
// dependências inválidas, etapas sem responsável) e mostra a simulação por
// ondas de execução, antes de submeter/publicar.

'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from './Skeleton';
import type { TemplateValidation } from './types';

export function TemplateValidationModal({
  processId,
  onClose,
}: {
  processId: number;
  onClose: () => void;
}) {
  const validate = useApiMutation(() =>
    apiClient.post<TemplateValidation>(`/processes/${processId}/validate`, {}),
  );

  // Corre uma vez ao abrir.
  useEffect(() => {
    validate.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId]);

  const r = validate.data;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Testar o fluxo"
        description="Valida ciclos, dependências e responsáveis, e simula a ordem de execução."
        className="max-h-[85vh] max-w-xl overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {validate.isPending && <Skeleton rows={3} />}
          {validate.error && (
            <p className="font-body text-sm text-danger">{validate.error.message}</p>
          )}
          {r && (
            <>
              <div
                className={`flex items-center gap-2 rounded-card p-3 font-body text-sm ${
                  r.valid ? 'bg-success-subtle text-success-ink' : 'bg-danger-subtle text-danger-ink'
                }`}
              >
                {r.valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {r.valid
                  ? `${r.code} v${r.version}: o fluxo é válido.`
                  : `${r.code} v${r.version}: o fluxo tem ${r.errors.length} erro(s).`}
              </div>

              {r.errors.length > 0 && (
                <ul className="space-y-1 font-body text-sm text-danger-ink">
                  {r.errors.map((e) => (
                    <li key={e} className="flex gap-2">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              )}
              {r.warnings.length > 0 && (
                <ul className="space-y-1 font-body text-sm text-warning-ink">
                  {r.warnings.map((w) => (
                    <li key={w} className="flex gap-2">
                      <TriangleAlert size={14} className="mt-0.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              )}

              {r.simulation.length > 0 && (
                <div>
                  <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Simulação de execução
                  </h4>
                  <ol className="space-y-2">
                    {r.simulation.map((w) => (
                      <li key={w.wave} className="rounded-card border border-border bg-surface p-3">
                        <div className="font-body text-xs text-ink-faint">
                          Onda {w.wave}
                          {w.steps.length > 1 ? ' — em paralelo' : ''}
                        </div>
                        <div className="mt-0.5 font-body text-sm text-ink">{w.steps.join('  ·  ')}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
        <div className="mt-5 flex justify-end">
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
