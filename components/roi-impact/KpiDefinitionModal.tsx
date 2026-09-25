// components/roi-impact/KpiDefinitionModal.tsx
// "Novo KPI" / edição (docs/roi-impact.md §6) — define um KPI na biblioteca
// central (nome/código/categoria/fórmula/fonte/meta); não mede o valor em
// si, só a definição — a medição real fica a cargo de ImpactRecord quando o
// KPI é usado numa análise concreta.

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
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { KPI_CATEGORY_LABELS, KPI_FREQUENCY_LABELS } from './utils';
import type { KpiCategory, KpiDefinitionRow, KpiFrequency } from './types';

const CATEGORY_ITEMS = Object.entries(KPI_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const FREQUENCY_ITEMS = Object.entries(KPI_FREQUENCY_LABELS).map(([value, label]) => ({ value, label }));

export interface KpiDefinitionModalProps {
  kpi?: KpiDefinitionRow;
  onClose: () => void;
}

export function KpiDefinitionModal({ kpi, onClose }: KpiDefinitionModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');

  const [name, setName] = useState(kpi?.name ?? '');
  const [code, setCode] = useState(kpi?.code ?? '');
  const [category, setCategory] = useState<KpiCategory>(kpi?.category ?? 'PRODUTIVIDADE');
  const [description, setDescription] = useState(kpi?.description ?? '');
  const [unit, setUnit] = useState(kpi?.unit ?? '');
  const [formula, setFormula] = useState(kpi?.formula ?? '');
  const [dataSource, setDataSource] = useState(kpi?.dataSource ?? '');
  const [frequency, setFrequency] = useState<KpiFrequency>(kpi?.frequency ?? 'MENSAL');
  const [targetValue, setTargetValue] = useState(kpi?.targetValue != null ? String(kpi.targetValue) : '');
  const [benchmarkNote, setBenchmarkNote] = useState(kpi?.benchmarkNote ?? '');
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);

  const save = useApiMutation(
    () => {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        category,
        description: description.trim() || undefined,
        unit: unit.trim(),
        formula: formula.trim() || undefined,
        dataSource: dataSource.trim() || undefined,
        frequency,
        targetValue: targetValue ? Number(targetValue) : undefined,
        benchmarkNote: benchmarkNote.trim() || undefined,
        responsibleId: responsible?.id,
      };
      return kpi
        ? apiClient.patch(`/roi-impact/kpis/${kpi.id}`, payload)
        : apiClient.post('/roi-impact/kpis', payload);
    },
    {
      invalidateKeys: [queryKeys.roiImpact.kpis(), queryKeys.roiImpact.kpisByCategory()],
      onSuccess: () => {
        notify({ title: kpi ? 'KPI actualizado' : 'KPI criado', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao guardar o KPI.'),
    },
  );

  const canSave = name.trim().length > 0 && code.trim().length > 0 && unit.trim().length > 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={kpi ? 'Editar KPI' : 'Novo KPI'}
        description="Biblioteca central de KPIs — docs/roi-impact.md §6"
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
            <FormField label="Nome *" htmlFor="kpi-name">
              <Input id="kpi-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Código *" htmlFor="kpi-code">
              <Input
                id="kpi-code"
                placeholder="ex.: TURNOVER_VOLUNTARIO"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full"
                disabled={!!kpi}
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="kpi-description">
            <Textarea
              id="kpi-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Categoria *" htmlFor="kpi-category">
              <Select
                items={CATEGORY_ITEMS}
                value={category}
                onValueChange={(v) => setCategory(v as KpiCategory)}
                className="w-full"
              />
            </FormField>
            <FormField label="Unidade de medida *" htmlFor="kpi-unit">
              <Input
                id="kpi-unit"
                placeholder="ex.: %, AOA, dias…"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Frequência de recolha *" htmlFor="kpi-frequency">
              <Select
                items={FREQUENCY_ITEMS}
                value={frequency}
                onValueChange={(v) => setFrequency(v as KpiFrequency)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Fórmula de cálculo" htmlFor="kpi-formula">
            <Input
              id="kpi-formula"
              placeholder="ex.: (Saídas voluntárias ÷ Efetivo médio) × 100"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fonte de dados" htmlFor="kpi-source">
              <Input
                id="kpi-source"
                placeholder="ex.: Payroll, Trainings, importação manual…"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Meta/benchmark interno" htmlFor="kpi-target">
              <Input
                id="kpi-target"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Nota de benchmark" htmlFor="kpi-benchmark-note">
            <Input
              id="kpi-benchmark-note"
              value={benchmarkNote}
              onChange={(e) => setBenchmarkNote(e.target.value)}
              className="w-full"
            />
          </FormField>

          <DepartmentUserPicker
            label="Responsável pela recolha"
            htmlFor="kpi-responsible"
            value={responsible}
            onChange={setResponsible}
          />
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
            {kpi ? 'Guardar alterações' : 'Criar KPI'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
