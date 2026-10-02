// components/processes/FlowTestModal.tsx
// «Testar o fluxo» antes de publicar (docs/Modulo_Processes.md §8): valida o
// grafo (ciclos, etapas sem responsável, condições sem saída) e simula o
// caminho tomado num cenário — prioridade, módulo de origem e o resultado de
// cada aprovação/decisão — mostrando ramos seguidos e etapas ignoradas.

'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { BLOCK_BY_TYPE } from './workflow-model';
import type { FlowSimulation, ProcessStep } from './types';

export interface FlowTestModalProps {
  processId: number;
  /** Etapas guardadas no servidor (têm as ordens finais). */
  steps: ProcessStep[];
  onClose: () => void;
}

const OUTCOME: Record<string, { label: string; cls: string }> = {
  EXECUTED: { label: 'executada', cls: 'text-info-ink' },
  AUTOMATIC: { label: 'automática', cls: 'text-ink-muted' },
  SKIPPED: { label: 'ignorada', cls: 'text-warning-ink' },
};

export function FlowTestModal({ processId, steps, onClose }: FlowTestModalProps) {
  const [priority, setPriority] = useState('NORMAL');
  const [sourceModule, setSourceModule] = useState('');
  const [results, setResults] = useState<Record<number, string>>({});
  const [formJson, setFormJson] = useState('');
  const [formError, setFormError] = useState('');

  const decisionSteps = steps.filter((s) => s.type === 'REVIEW' || s.type === 'DECISION');

  const run = useApiMutation((body: Record<string, unknown>) =>
    apiClient.post<FlowSimulation>(`/processes/${processId}/simulate`, body),
  );

  const simulate = () => {
    let form: Record<string, unknown> | undefined;
    if (formJson.trim()) {
      try {
        form = JSON.parse(formJson) as Record<string, unknown>;
      } catch {
        setFormError('JSON inválido');
        return;
      }
    }
    setFormError('');
    run.mutate({
      priority,
      ...(sourceModule ? { sourceModule } : {}),
      results,
      ...(form ? { form } : {}),
    });
  };

  const r = run.data;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Testar o fluxo"
        description="Simula o caminho que o processo faria com os dados abaixo."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Prioridade" htmlFor="ft-pri">
            <Select
              items={[
                { value: 'LOW', label: 'Baixa' },
                { value: 'NORMAL', label: 'Normal' },
                { value: 'HIGH', label: 'Alta' },
                { value: 'URGENT', label: 'Urgente' },
              ]}
              value={priority}
              onValueChange={setPriority}
              className="w-full"
            />
          </FormField>
          <FormField label="Módulo de origem" htmlFor="ft-mod">
            <Input id="ft-mod" value={sourceModule} onChange={(e) => setSourceModule(e.target.value)} />
          </FormField>
          {decisionSteps.map((s) => (
            <FormField key={s.order} label={`Resultado de «${s.title}»`} htmlFor={`ft-r-${s.order}`}>
              {s.type === 'REVIEW' ? (
                <Select
                  items={[
                    { value: 'APPROVED', label: 'Aprovada' },
                    { value: 'REJECTED', label: 'Rejeitada' },
                  ]}
                  value={results[s.order] ?? 'APPROVED'}
                  onValueChange={(v) => setResults((p) => ({ ...p, [s.order]: v }))}
                  className="w-full"
                />
              ) : (
                <Input
                  id={`ft-r-${s.order}`}
                  value={results[s.order] ?? ''}
                  onChange={(e) => setResults((p) => ({ ...p, [s.order]: e.target.value }))}
                  placeholder="resultado escolhido"
                />
              )}
            </FormField>
          ))}
          <div className="sm:col-span-2">
            <FormField label="Dados de formulário (JSON, opcional)" htmlFor="ft-form" hint='Ex.: {"motivo":"urgente"}'>
              <Input id="ft-form" value={formJson} onChange={(e) => setFormJson(e.target.value)} />
            </FormField>
            {formError && <p className="font-body text-xs text-danger">{formError}</p>}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={simulate} loading={run.isPending}>
            Simular
          </Button>
        </div>

        {run.error && <p className="mt-3 font-body text-sm text-danger">{run.error.message}</p>}

        {r && (
          <div className="mt-5 space-y-4">
            <div
              className={`flex items-center gap-2 rounded-card p-3 font-body text-sm ${
                r.valid && r.reachedEnd ? 'bg-success-subtle text-success-ink' : 'bg-danger-subtle text-danger-ink'
              }`}
            >
              {r.valid && r.reachedEnd ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {r.valid && r.reachedEnd
                ? 'O fluxo é válido e chega ao fim neste cenário.'
                : !r.reachedEnd
                  ? 'Neste cenário o fluxo não chega à etapa de fim.'
                  : 'O fluxo tem erros que impedem a publicação.'}
            </div>
            {r.errors.length > 0 && (
              <ul className="space-y-1">
                {r.errors.map((e, i) => (
                  <li key={i} className="flex gap-2 font-body text-sm text-danger-ink">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
            {r.warnings.length > 0 && (
              <ul className="space-y-1">
                {r.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 font-body text-sm text-warning-ink">
                    <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
            <div>
              <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Caminho percorrido ({r.executed} executadas, {r.skipped} ignoradas)
              </h4>
              <ol className="space-y-2">
                {r.trace.map((w) => (
                  <li key={w.wave} className="rounded-card border border-border p-2.5">
                    <div className="mb-1 font-body text-xs text-ink-faint">
                      Passo {w.wave}
                      {w.steps.length > 1 ? ' — em paralelo' : ''}
                    </div>
                    <ul className="space-y-0.5">
                      {w.steps.map((s) => (
                        <li key={s.order} className="font-body text-sm text-ink">
                          {s.title}{' '}
                          <span className="text-xs text-ink-faint">({BLOCK_BY_TYPE[s.type]?.label ?? s.type})</span>{' '}
                          <span className={`text-xs ${OUTCOME[s.outcome].cls}`}>
                            · {OUTCOME[s.outcome].label}
                            {s.result && s.outcome !== 'SKIPPED' ? ` (${s.result})` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
