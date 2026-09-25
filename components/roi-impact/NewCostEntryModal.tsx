// components/roi-impact/NewCostEntryModal.tsx
// "Nova Linha de Custo" (docs/roi-impact.md §5) — a categoria (direto/
// indireto/oportunidade) nunca é escolhida directamente: é sempre derivada
// no backend a partir da subcategoria seleccionada (CATEGORY_BY_COST_SUBCATEGORY
// aqui é só para pré-visualização). Quando a subcategoria é "Horas de
// trabalho perdidas", mostra um atalho para estimar o valor a partir do
// salário/hora em Payroll (Fontes §5) — o valor sugerido nunca é guardado
// sozinho, só pré-preenche o campo para o RH confirmar.

'use client';

import { useState } from 'react';
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
import type { CostSubCategory, InitiativeOption, LaborCostEstimateData, RoiInitiativeType } from './types';

const INITIATIVE_TYPE_ITEMS = Object.entries(INITIATIVE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const SUBCATEGORY_ITEMS = Object.entries(COST_SUBCATEGORY_LABELS).map(([value, label]) => ({
  value,
  label: `${label} (${COST_CATEGORY_LABELS[CATEGORY_BY_COST_SUBCATEGORY[value]]})`,
}));

export interface NewCostEntryModalProps {
  onClose: () => void;
}

export function NewCostEntryModal({ onClose }: NewCostEntryModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');

  const [initiativeType, setInitiativeType] = useState<RoiInitiativeType>('FORMACAO');
  const [initiativeId, setInitiativeId] = useState('');
  const [subCategory, setSubCategory] = useState<CostSubCategory>('FORMADOR_CONSULTOR');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [incurredAt, setIncurredAt] = useState('');

  const [estimateUser, setEstimateUser] = useState<DirectoryUser | null>(null);
  const [estimateHours, setEstimateHours] = useState('');

  const { data: initiativeOptions } = useApiQuery<InitiativeOption[]>(
    queryKeys.roiImpact.initiativeOptions(initiativeType),
    '/roi-impact/analyses/initiative-options',
    { params: { type: initiativeType }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const estimate = useApiMutation(
    () =>
      apiClient.post<LaborCostEstimateData>('/roi-impact/costs/estimate-labor-cost', {
        userIds: estimateUser ? [estimateUser.id] : [],
        hours: Number(estimateHours),
      }),
    {
      onSuccess: (data) => {
        setAmount(String(data.totalCost));
        setSource(
          `Payroll — ${estimateHours}h × salário/hora${data.note ? ` (${data.note})` : ''}`,
        );
        notify({ title: 'Custo estimado a partir do Payroll', intent: 'success' });
      },
      onError: (e) => notify({ title: 'Erro ao estimar', description: e.message, intent: 'danger' }),
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
      invalidateKeys: [queryKeys.roiImpact.costs(), queryKeys.roiImpact.costsConsolidation()],
      onSuccess: () => {
        notify({ title: 'Linha de custo guardada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao guardar a linha de custo.'),
    },
  );

  const canEstimate = subCategory === 'HORAS_TRABALHO_PERDIDAS' && !!estimateUser && Number(estimateHours) > 0;
  const canSave = amount !== '' && Number(amount) >= 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Linha de Custo"
        description="Consolida o custo real de uma iniciativa — docs/roi-impact.md §5"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo de iniciativa" htmlFor="ce-init-type">
              <Select
                items={INITIATIVE_TYPE_ITEMS}
                value={initiativeType}
                onValueChange={(v) => {
                  setInitiativeType(v as RoiInitiativeType);
                  setInitiativeId('');
                }}
                className="w-full"
              />
            </FormField>
            <FormField label="Iniciativa" htmlFor="ce-init">
              <Select
                items={(initiativeOptions ?? []).map((o) => ({ value: String(o.id), label: o.label }))}
                value={initiativeId}
                onValueChange={setInitiativeId}
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Subcategoria de custo *" htmlFor="ce-subcategory">
            <Select
              items={SUBCATEGORY_ITEMS}
              value={subCategory}
              onValueChange={(v) => setSubCategory(v as CostSubCategory)}
              className="w-full"
            />
          </FormField>

          {subCategory === 'HORAS_TRABALHO_PERDIDAS' && (
            <div className="space-y-3 rounded-card border border-dashed border-border p-3">
              <p className="flex items-center gap-1.5 font-body text-xs font-medium text-ink">
                <Calculator size={14} strokeWidth={1.75} />
                Estimar a partir do salário/hora (Payroll)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <DepartmentUserPicker
                  label="Colaborador"
                  htmlFor="ce-estimate-user"
                  value={estimateUser}
                  onChange={setEstimateUser}
                />
                <FormField label="Horas em formação" htmlFor="ce-estimate-hours">
                  <Input
                    id="ce-estimate-hours"
                    type="number"
                    min={0}
                    value={estimateHours}
                    onChange={(e) => setEstimateHours(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor (AOA) *" htmlFor="ce-amount">
              <Input
                id="ce-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data" htmlFor="ce-incurred-at">
              <Input
                id="ce-incurred-at"
                type="date"
                value={incurredAt}
                onChange={(e) => setIncurredAt(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Fonte" htmlFor="ce-source">
            <Input
              id="ce-source"
              placeholder="ex.: fatura do fornecedor, Payroll, Trainings…"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="justify-center" onClick={onClose} disabled={create.isPending}>
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
