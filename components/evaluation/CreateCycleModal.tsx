// components/evaluation/CreateCycleModal.tsx
// Modal de criação de ciclo de avaliação — validação (useFormValidation p/ o
// nome) + mutação (useApiMutation). Segue o padrão de
// components/courses/CreateCourseModal: o page.tsx só monta este componente
// quando `showCreate` é true, por isso o Modal fica sempre `open`;
// onOpenChange chama onClose (cobre o X, o clique fora e o Escape).
//
// Submete em POST /evaluations/cycles (@Roles(ADMIN, RH) no backend,
// evaluation.controller.ts). O botão que abre esta modal já está escondido
// para quem não é ADMIN/RH — aqui assume-se o mesmo RBAC. O backend cria
// sempre o ciclo em estado DRAFT; publica-se/activa-se depois no separador
// "Ciclos" (CyclesTab).
//
// O CreateCycleDto (evaluation.dto.ts) exige `weights`: um peso 0–100 por
// tipo de avaliador. A UI mostra os 5 tipos com um total ao vivo e só deixa
// submeter quando a soma dá 100 (linhas a 0 são omitidas do payload).

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

// Espelha o enum EvalModel do backend (evaluation.dto.ts), ordem do mais
// simples para o mais completo.
const MODEL_ITEMS = ['90', '180', '270', '360', 'CONTINUOUS', 'PROJECT'].map(
  (value) => ({ value, label: MODEL_LABEL[value] ?? value }),
);

// Espelha o enum EvalType do backend. Pesos-semente de um 360 típico (somam
// 100) — o utilizador ajusta.
const WEIGHT_TYPES = [
  'SELF',
  'MANAGER',
  'PEER',
  'SUBORDINATE',
  'CLIENT',
] as const;
type WeightType = (typeof WEIGHT_TYPES)[number];
const DEFAULT_WEIGHTS: Record<WeightType, string> = {
  SELF: '10',
  MANAGER: '40',
  PEER: '30',
  SUBORDINATE: '15',
  CLIENT: '5',
};

export function CreateCycleModal({
  onClose,
  onSuccess,
}: CreateCycleModalProps) {
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

  const [selfInScore, setSelfInScore] = useState(true);
  const [weights, setWeights] =
    useState<Record<WeightType, string>>(DEFAULT_WEIGHTS);
  const [submitError, setSubmitError] = useState('');

  const parsedWeights = useMemo(
    () =>
      WEIGHT_TYPES.map((type) => ({
        type,
        weight: Number(weights[type]),
      })).filter((w) => Number.isFinite(w.weight) && w.weight > 0),
    [weights],
  );
  const weightTotal = parsedWeights.reduce((s, w) => s + w.weight, 0);

  const createCycle = useApiMutation(
    () =>
      apiClient.post('/evaluations/cycles', {
        name: form.name.trim(),
        model: form.model,
        startDate: form.startDate,
        endDate: form.endDate,
        selfEvalIncludedInScore: selfInScore,
        weights: parsedWeights,
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
      }),
    {
      invalidateKeys: [queryKeys.evaluation.all],
      onSuccess: () => {
        notify({
          title: 'Ciclo criado',
          description:
            'O ciclo foi criado como rascunho. Publica-o no separador "Ciclos".',
          intent: 'success',
        });
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError(
          'Erro ao criar o ciclo. Verifica os dados e tenta de novo.',
        ),
    },
  );
  const loading = createCycle.isPending;

  const localError = (() => {
    if (!form.startDate || !form.endDate)
      return 'Indica as datas de início e fim.';
    if (form.endDate < form.startDate)
      return 'A data de fim não pode ser anterior à de início.';
    if (parsedWeights.some((w) => w.weight < 0 || w.weight > 100))
      return 'Cada peso tem de estar entre 0 e 100.';
    if (weightTotal !== 100)
      return `Os pesos dos avaliadores têm de somar 100 (soma actual: ${weightTotal}).`;
    return '';
  })();

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
        description="O ciclo é criado como rascunho. Publica-o e activa-o depois no separador Ciclos."
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
              placeholder="Ex.: Avaliação Semestral 2026 — S1"
            />
          </FormField>

          <FormField label="Modelo *" htmlFor="cyc-model">
            <Select
              items={MODEL_ITEMS}
              value={form.model || undefined}
              onValueChange={(v) => setField('model', v)}
              className="w-full"
              placeholder="Selecionar modelo"
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
            <p className="mt-1 mb-2 font-body text-xs text-ink-muted">
              Coloca 0 num tipo que não se aplica a este ciclo. A soma tem de
              dar 100.
            </p>
            <div className="space-y-2">
              {WEIGHT_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-3">
                  <label
                    htmlFor={`cyc-w-${type}`}
                    className="flex-1 font-body text-sm text-ink-muted"
                  >
                    {TYPE_LABEL[type] ?? type}
                  </label>
                  <Input
                    id={`cyc-w-${type}`}
                    type="number"
                    min={0}
                    max={100}
                    value={weights[type]}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [type]: e.target.value }))
                    }
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={selfInScore}
              onChange={(e) => setSelfInScore(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong"
            />
            Incluir a autoavaliação no cálculo do score final
          </label>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={loading}
          >
            {loading ? 'A criar...' : 'Criar Ciclo'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
