// components/roi-impact/NewCostEntryModal.tsx
// "Nova Linha de Custo" (docs/roi-impact.md §5) — a categoria (direto/
// indireto/oportunidade) nunca é escolhida directamente: é sempre derivada
// no backend a partir da subcategoria seleccionada (CATEGORY_BY_COST_SUBCATEGORY
// aqui é só para pré-visualização). Quando a subcategoria é "Horas de
// trabalho perdidas", mostra um atalho para estimar o valor a partir do
// salário/hora em Payroll (Fontes §5) — o valor sugerido nunca é guardado
// sozinho, só pré-preenche o campo para o RH confirmar.

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle, Calculator } from 'lucide-react';
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
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import {
  INITIATIVE_TYPE_LABELS,
  COST_SUBCATEGORY_LABELS,
  CATEGORY_BY_COST_SUBCATEGORY,
  COST_CATEGORY_LABELS,
} from './utils';
import type {
  CostSubCategory,
  InitiativeOption,
  LaborCostEstimateData,
  RoiInitiativeType,
} from './types';

const INITIATIVE_TYPE_ITEMS = Object.entries(INITIATIVE_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
const SUBCATEGORY_ITEMS = Object.entries(COST_SUBCATEGORY_LABELS).map(
  ([value, label]) => ({
    value,
    label: `${label} (${COST_CATEGORY_LABELS[CATEGORY_BY_COST_SUBCATEGORY[value]]})`,
  }),
);

const SOURCE_BLANK = '__blank';
const SOURCE_MANUAL = '__manual';
const SOURCE_PRESETS = [
  'Fatura do fornecedor',
  'Folha Salarial',
  'Formações',
  'Orçamento aprovado',
  'Contabilidade',
];
const SOURCE_ITEMS = [
  { value: SOURCE_BLANK, label: 'Deixar em branco' },
  ...SOURCE_PRESETS.map((v) => ({ value: v, label: v })),
  { value: SOURCE_MANUAL, label: 'Escrever manualmente…' },
];

export interface NewCostEntryModalProps {
  onClose: () => void;
}

interface NewCostEntryModalFormValues {
  error: string;
  initiativeType: RoiInitiativeType;
  initiativeId: string;
  subCategory: CostSubCategory;
  description: string;
  amount: string;
  source: string;
  sourceMode: string;
  incurredAt: string;
  estimateUser: DirectoryUser | null;
  estimateHours: string;
}

export function NewCostEntryModal({ onClose }: NewCostEntryModalProps) {
  const notify = useToast();
  const { values: formValues, set: setField } =
    useFormState<NewCostEntryModalFormValues>({
      error: '',
      initiativeType: 'FORMACAO',
      initiativeId: '',
      subCategory: 'FORMADOR_CONSULTOR',
      description: '',
      amount: '',
      source: '',
      sourceMode: SOURCE_BLANK,
      incurredAt: '',
      estimateUser: null,
      estimateHours: '',
    });
  const {
    error,
    initiativeType,
    initiativeId,
    subCategory,
    description,
    amount,
    source,
    sourceMode,
    incurredAt,
    estimateUser,
    estimateHours,
  } = formValues;

  const { data: initiativeOptions } = useApiQuery<InitiativeOption[]>(
    queryKeys.roiImpact.initiativeOptions(initiativeType),
    '/roi-impact/analyses/initiative-options',
    { params: { type: initiativeType }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const estimate = useApiMutation(
    () =>
      apiClient.post<LaborCostEstimateData>(
        '/roi-impact/costs/estimate-labor-cost',
        {
          userIds: estimateUser ? [estimateUser.id] : [],
          hours: Number(estimateHours),
        },
      ),
    {
      onSuccess: (data) => {
        setField('amount', String(data.totalCost));
        setField('sourceMode', SOURCE_MANUAL);
        setField(
          'source',
          `Folha Salarial — ${estimateHours}h × salário/hora${data.note ? ` (${data.note})` : ''}`,
        );
        notify({
          title: 'Custo estimado a partir da Folha Salarial',
          intent: 'success',
        });
      },
      onError: (e) =>
        notify({
          title: 'Erro ao estimar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const create = useApiMutation(
    () =>
      apiClient.post('/roi-impact/costs', {
        initiativeType,
        initiativeId: initiativeId ? Number(initiativeId) : undefined,
        subCategory,
        description: description.trim() || undefined,
        amount: Number(amount),
        source: source.trim() || undefined,
        incurredAt: incurredAt || undefined,
      }),
    {
      invalidateKeys: [
        queryKeys.roiImpact.costs(),
        queryKeys.roiImpact.costsConsolidation(),
      ],
      onSuccess: () => {
        notify({ title: 'Linha de custo guardada', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setField('error', e.message || 'Erro ao guardar a linha de custo.'),
    },
  );

  const canEstimate =
    subCategory === 'HORAS_TRABALHO_PERDIDAS' &&
    !!estimateUser &&
    Number(estimateHours) > 0;
  const canSave = amount !== '' && Number(amount) >= 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Linha de Custo"
        description="Consolida o custo real de uma iniciativa — docs/roi-impact.md §5"
        className="max-h-[90vh] max-w-2xl overflow-y-auto overflow-x-hidden"
      >
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
            <FormField label="Tipo de iniciativa" htmlFor="ce-init-type">
              <Select
                items={INITIATIVE_TYPE_ITEMS}
                value={initiativeType}
                onValueChange={(v) => {
                  setField('initiativeType', v as RoiInitiativeType);
                  setField('initiativeId', '');
                }}
                className="w-full"
              />
            </FormField>
            <FormField label="Iniciativa" htmlFor="ce-init">
              <Select
                items={(initiativeOptions ?? []).map((o) => ({
                  value: String(o.id),
                  label: o.label,
                }))}
                value={initiativeId}
                onValueChange={(v) => setField('initiativeId', v)}
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Subcategoria de custo *" htmlFor="ce-subcategory">
            <Select
              items={SUBCATEGORY_ITEMS}
              value={subCategory}
              onValueChange={(v) =>
                setField('subCategory', v as CostSubCategory)
              }
              className="w-full"
            />
          </FormField>

          {subCategory === 'HORAS_TRABALHO_PERDIDAS' && (
            <div className="space-y-3 rounded-card border border-dashed border-border p-3">
              <p className="flex items-center gap-1.5 font-body text-xs font-medium text-ink">
                <Calculator size={14} strokeWidth={1.75} />
                Estimar a partir do salário/hora (Folha Salarial)
              </p>
              <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
                <DepartmentUserPicker
                  label="Colaborador"
                  htmlFor="ce-estimate-user"
                  value={estimateUser}
                  onChange={(v) => setField('estimateUser', v)}
                />
                <FormField
                  label="Horas em formação"
                  htmlFor="ce-estimate-hours"
                >
                  <Input
                    id="ce-estimate-hours"
                    type="number"
                    min={0}
                    value={estimateHours}
                    onChange={(e) => setField('estimateHours', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
              <Button
                size="sm"
                intent="secondary"
                disabled={!canEstimate}
                loading={estimate.isPending}
                onClick={() => estimate.mutate(undefined)}
              >
                Estimar custo
              </Button>
            </div>
          )}

          <FormField label="Descrição" htmlFor="ce-description">
            <Input
              id="ce-description"
              value={description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
            <FormField label="Valor (AOA) *" htmlFor="ce-amount">
              <Input
                id="ce-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setField('amount', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data" htmlFor="ce-incurred-at">
              <Input
                id="ce-incurred-at"
                type="date"
                value={incurredAt}
                onChange={(e) => setField('incurredAt', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Fonte" htmlFor="ce-source">
            <Select
              items={SOURCE_ITEMS}
              value={sourceMode}
              onValueChange={(v) => {
                setField('sourceMode', v);
                setField(
                  'source',
                  v === SOURCE_BLANK || v === SOURCE_MANUAL ? '' : v,
                );
              }}
              className="w-full"
            />
          </FormField>
          {sourceMode === SOURCE_MANUAL && (
            <Input
              id="ce-source"
              placeholder="Escrever a fonte…"
              value={source}
              onChange={(e) => setField('source', e.target.value)}
              className="w-full"
            />
          )}
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="justify-center"
            onClick={onClose}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => create.mutate(undefined)}
            loading={create.isPending}
            disabled={!canSave}
          >
            Guardar linha de custo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
