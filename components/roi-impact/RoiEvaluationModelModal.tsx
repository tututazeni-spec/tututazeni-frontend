// components/roi-impact/RoiEvaluationModelModal.tsx
// "Novo Modelo de Avaliação" / edição (docs/roi-impact.md §4) — configura a
// metodologia (Kirkpatrick 4 níveis + extensão Phillips) usada para medir
// impacto/ROI. Os 5 níveis são sempre os mesmos (o spec não permite
// inventar níveis novos) — o que varia por modelo é se cada um está
// incluído, a obrigatoriedade e o peso na pontuação final.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { INITIATIVE_TYPE_LABELS } from './utils';
import type { RoiEvaluationLevel, RoiEvaluationModelRow, RoiInitiativeType } from './types';

const DEFAULT_LEVELS: (RoiEvaluationLevel & { included: boolean; measures: string })[] = [
  { level: 1, name: 'Reação', mandatory: true, weight: 10, included: true, measures: 'Satisfação com a formação' },
  {
    level: 2,
    name: 'Aprendizagem',
    mandatory: true,
    weight: 20,
    included: true,
    measures: 'Conhecimento/competência adquirida',
  },
  {
    level: 3,
    name: 'Comportamento',
    mandatory: true,
    weight: 25,
    included: true,
    measures: 'Aplicação no posto de trabalho',
  },
  {
    level: 4,
    name: 'Resultados',
    mandatory: false,
    weight: 25,
    included: true,
    measures: 'Impacto nos indicadores de negócio',
  },
  { level: 5, name: 'ROI', mandatory: false, weight: 20, included: true, measures: 'Retorno financeiro' },
];

const INITIATIVE_TYPE_OPTIONS = Object.entries(INITIATIVE_TYPE_LABELS) as [RoiInitiativeType, string][];

function toFormLevels(levels: RoiEvaluationLevel[] | undefined) {
  return DEFAULT_LEVELS.map((d) => {
    const existing = levels?.find((l) => l.level === d.level);
    return existing
      ? { ...d, name: existing.name, mandatory: existing.mandatory, weight: existing.weight, included: true }
      : { ...d, included: !levels };
  });
}

export interface RoiEvaluationModelModalProps {
  model?: RoiEvaluationModelRow;
  onClose: () => void;
}

export function RoiEvaluationModelModal({ model, onClose }: RoiEvaluationModelModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');
  const [name, setName] = useState(model?.name ?? '');
  const [description, setDescription] = useState(model?.description ?? '');
  const [levels, setLevels] = useState(toFormLevels(model?.levels));
  const [initiativeTypes, setInitiativeTypes] = useState<RoiInitiativeType[]>(
    model?.applicability?.initiativeTypes ?? [],
  );
  const [criticality, setCriticality] = useState((model?.applicability?.criticality ?? []).join(', '));
  const [minCost, setMinCost] = useState(
    model?.applicability?.minCost != null ? String(model.applicability.minCost) : '',
  );

  const save = useApiMutation(
    () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        levels: levels
          .filter((l) => l.included)
          .map((l) => ({ level: l.level, name: l.name, mandatory: l.mandatory, weight: l.weight })),
        applicability: {
          initiativeTypes: initiativeTypes.length ? initiativeTypes : undefined,
          criticality: criticality.trim()
            ? criticality.split(',').map((c) => c.trim()).filter(Boolean)
            : undefined,
          minCost: minCost ? Number(minCost) : undefined,
        },
      };
      return model
        ? apiClient.patch(`/roi-impact/evaluation-models/${model.id}`, payload)
        : apiClient.post('/roi-impact/evaluation-models', payload);
    },
    {
      invalidateKeys: [queryKeys.roiImpact.evaluationModels()],
      onSuccess: () => {
        notify({ title: model ? 'Modelo actualizado' : 'Modelo criado', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao guardar o modelo de avaliação.'),
    },
  );

  const toggleInitiativeType = (t: RoiInitiativeType) => {
    setInitiativeTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const updateLevel = <K extends 'included' | 'name' | 'mandatory' | 'weight'>(
    level: number,
    field: K,
    value: (typeof DEFAULT_LEVELS)[number][K],
  ) => {
    setLevels((prev) => prev.map((l) => (l.level === level ? { ...l, [field]: value } : l)));
  };

  const canSave = name.trim().length > 0 && levels.some((l) => l.included);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={model ? 'Editar Modelo de Avaliação' : 'Novo Modelo de Avaliação'}
        description="Kirkpatrick (4 níveis) + extensão Phillips (5º nível, ROI) — docs/roi-impact.md §4"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <FormField label="Nome do modelo *" htmlFor="rem-name">
            <Input id="rem-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
          </FormField>
          <FormField label="Descrição" htmlFor="rem-description">
            <Textarea
              id="rem-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </FormField>

          <div>
            <p className="mb-2 font-body text-sm font-medium text-ink">Níveis incluídos</p>
            <div className="overflow-hidden rounded-card border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken text-xs text-ink-faint">
                  <tr>
                    <th className="px-3 py-2 text-left">Incluído</th>
                    <th className="px-3 py-2 text-left">Nível</th>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Mede</th>
                    <th className="px-3 py-2 text-left">Obrigatório</th>
                    <th className="px-3 py-2 text-left">Peso (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {levels.map((l) => (
                    <tr key={l.level} className={l.included ? '' : 'opacity-50'}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={l.included}
                          onChange={(e) => updateLevel(l.level, 'included', e.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2 text-ink-faint">{l.level}</td>
                      <td className="px-3 py-2">
                        <Input
                          value={l.name}
                          disabled={!l.included}
                          onChange={(e) => updateLevel(l.level, 'name', e.target.value)}
                          className="w-full"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-ink-faint">{l.measures}</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={l.mandatory}
                          disabled={!l.included}
                          onChange={(e) => updateLevel(l.level, 'mandatory', e.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          disabled={!l.included}
                          value={l.weight}
                          onChange={(e) => updateLevel(l.level, 'weight', Number(e.target.value))}
                          className="w-20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Regra recomendada: exigir medição até ao Nível 3 para todas as formações; Nível 4/5 só
              para iniciativas acima de um limiar de custo/criticidade.
            </p>
          </div>

          <div>
            <p className="mb-2 font-body text-sm font-medium text-ink">Aplicável a</p>
            <div className="flex flex-wrap gap-3">
              {INITIATIVE_TYPE_OPTIONS.map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={initiativeTypes.includes(value)}
                    onChange={() => toggleInitiativeType(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Criticidade (separada por vírgulas)" htmlFor="rem-criticality">
              <Input
                id="rem-criticality"
                placeholder="ex.: estratégica, alta visibilidade"
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Custo mínimo" htmlFor="rem-min-cost">
              <Input
                id="rem-min-cost"
                type="number"
                min={0}
                value={minCost}
                onChange={(e) => setMinCost(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="justify-center" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => save.mutate(undefined)}
            loading={save.isPending}
            disabled={!canSave}
          >
            {model ? 'Guardar alterações' : 'Criar modelo'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
