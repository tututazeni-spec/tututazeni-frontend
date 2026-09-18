// components/evaluation/CreateCycleModal.tsx
// Modal "Novo Ciclo" do separador "Ciclos" do módulo Evaluation genérico
// (docs/12-modulo-evaluation.md) — distinto do CreateCycleModal de
// evaluation360 (components/evaluation360/CreateCycleModal.tsx), que fala
// com o módulo evaluation360 à parte (/evaluation360/cycles).
//
// Só expõe os campos essenciais para criar um ciclo utilizável (nome,
// modelo, datas, pesos por tipo de avaliador) — CreateCycleDto tem muitos
// mais campos opcionais (código, categoria, escalas, regras de
// confidencialidade/edição/contestação, links a PDI/competências/carreira/
// sucessão/9-Box, etc.) que ficam nos defaults do backend por agora; editar
// esses campos fica para outra iteração se vier a ser pedido.

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { MODEL_LABEL, TYPE_LABEL } from './constants';

export interface CreateCycleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const MODEL_ITEMS = Object.entries(MODEL_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// Espelha EvalType (evaluation.dto.ts) — pesos por omissão que somam 100
// (autoavaliação conta pouco, gestor directo pesa mais).
const WEIGHT_TYPES = ['SELF', 'MANAGER', 'PEER', 'SUBORDINATE', 'CLIENT'] as const;
type WeightType = (typeof WEIGHT_TYPES)[number];
const DEFAULT_WEIGHTS: Record<WeightType, string> = {
  SELF: '10',
  MANAGER: '40',
  PEER: '30',
  SUBORDINATE: '20',
  CLIENT: '0',
};

export function CreateCycleModal({ onClose, onSuccess }: CreateCycleModalProps) {
  const notify = useToast();
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: '',
      model: '360',
      description: '',
      startDate: '',
      endDate: '',
    },
    { name: [required()] },
  );

  const [weights, setWeights] = useState<Record<WeightType, string>>(DEFAULT_WEIGHTS);
  const [submitError, setSubmitError] = useState('');

  const weightTotal = WEIGHT_TYPES.reduce((s, t) => s + (Number(weights[t]) || 0), 0);

  const createCycle = useApiMutation(
    () =>
      apiClient.post('/evaluations/cycles', {
        name: form.name.trim(),
        model: form.model,
        startDate: form.startDate,
        endDate: form.endDate,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        weights: WEIGHT_TYPES.filter((t) => (Number(weights[t]) || 0) > 0).map((t) => ({
          type: t,
          weight: Number(weights[t]),
        })),
      }),
    {
      invalidateKeys: [queryKeys.evaluation.cycles()],
      onSuccess: () => {
        notify({ title: 'Ciclo criado', intent: 'success' });
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setSubmitError(e instanceof Error ? e.message : 'Erro ao criar o ciclo.'),
    },
  );
  const loading = createCycle.isPending;

  const localError = useMemo(() => {
    if (!form.startDate || !form.endDate) return 'Indica as datas de início e fim.';
    if (form.endDate < form.startDate) return 'A data de fim não pode ser anterior à de início.';
    if (Math.abs(weightTotal - 100) > 0.5)
      return `Os pesos por tipo de avaliador têm de somar 100 (soma actual: ${weightTotal}).`;
    return '';
  }, [form.startDate, form.endDate, weightTotal]);

  const error = validationError || submitError || localError;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    if (localError) return;
    createCycle.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Ciclo de Avaliação"
        description="Cria um ciclo com o modelo e os pesos por tipo de avaliador desejados."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome *" htmlFor="cyc-name">
            <Input
              id="cyc-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex.: Avaliação de Desempenho 2026 — S1"
            />
          </FormField>

          <FormField label="Modelo *" htmlFor="cyc-model">
            <Select
              items={MODEL_ITEMS}
              value={form.model}
              onValueChange={(v) => setField('model', v)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Início *" htmlFor="cyc-start">
              <Input
                id="cyc-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Fim *" htmlFor="cyc-end">
              <Input
                id="cyc-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="cyc-description">
            <Textarea
              id="cyc-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={2}
              placeholder="Âmbito, objectivos, notas para os participantes…"
            />
          </FormField>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-body text-sm font-medium text-ink">
                Pesos por tipo de avaliador
              </span>
              <span
                className={
                  weightTotal === 100
                    ? 'font-body text-xs text-success-ink'
                    : 'font-body text-xs text-danger-ink'
                }
              >
                Total: {weightTotal} / 100
              </span>
            </div>
            <div className="mt-2 space-y-2">
              {WEIGHT_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-3">
                  <label
                    htmlFor={`cyc-w-${type}`}
                    className="flex-1 font-body text-sm text-ink-muted"
                  >
                    {TYPE_LABEL[type]}
                  </label>
                  <Input
                    id={`cyc-w-${type}`}
                    type="number"
                    min={0}
                    max={100}
                    value={weights[type]}
                    onChange={(e) => setWeights((w) => ({ ...w, [type]: e.target.value }))}
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'A criar...' : 'Criar Ciclo'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
