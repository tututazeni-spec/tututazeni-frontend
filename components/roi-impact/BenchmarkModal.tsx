// components/roi-impact/BenchmarkModal.tsx
// "Novo benchmark" / edição (docs/roi-impact.md §9) — registo manual de uma
// referência interna (meta explícita) ou externa (mercado/sector, sempre
// com fonte registada — nunca inventada). As comparações "entre
// departamentos/unidades/ciclos" são computadas à parte a partir de
// RoiAnalysis (ver BenchmarksTab) — este formulário só cria o registo.

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
import { BENCHMARK_TYPE_LABELS } from './utils';
import type { BenchmarkRow, BenchmarkType } from './types';

const TYPE_ITEMS = Object.entries(BENCHMARK_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export interface BenchmarkModalProps {
  benchmark?: BenchmarkRow;
  onClose: () => void;
}

export function BenchmarkModal({ benchmark, onClose }: BenchmarkModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');

  const [name, setName] = useState(benchmark?.name ?? '');
  const [type, setType] = useState<BenchmarkType>(benchmark?.type ?? 'EXTERNO');
  const [source, setSource] = useState(benchmark?.source ?? '');
  const [referenceYear, setReferenceYear] = useState(
    benchmark ? String(benchmark.referenceYear) : String(new Date().getFullYear()),
  );
  const [value, setValue] = useState(benchmark ? String(benchmark.value) : '');
  const [unit, setUnit] = useState(benchmark?.unit ?? '');
  const [indicatorName, setIndicatorName] = useState(benchmark?.indicatorName ?? '');
  const [observations, setObservations] = useState(benchmark?.observations ?? '');

  const save = useApiMutation(
    () => {
      const payload = {
        name: name.trim(),
        type,
        source: source.trim(),
        referenceYear: Number(referenceYear),
        value: Number(value),
        unit: unit.trim(),
        indicatorName: indicatorName.trim() || undefined,
        observations: observations.trim() || undefined,
      };
      return benchmark
        ? apiClient.patch(`/roi-impact/benchmarks/${benchmark.id}`, payload)
        : apiClient.post('/roi-impact/benchmarks', payload);
    },
    {
      invalidateKeys: [
        queryKeys.roiImpact.benchmarks(),
        queryKeys.roiImpact.benchmarkSectorComparison(),
      ],
      onSuccess: () => {
        notify({ title: benchmark ? 'Benchmark actualizado' : 'Benchmark registado', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao guardar o benchmark.'),
    },
  );

  const canSave =
    name.trim().length > 0 &&
    source.trim().length > 0 &&
    unit.trim().length > 0 &&
    referenceYear.trim().length > 0 &&
    value.trim().length > 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={benchmark ? 'Editar benchmark' : 'Novo benchmark'}
        description="Referências internas/externas para contextualizar ROI — docs/roi-impact.md §9"
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
            <FormField label="Nome do benchmark *" htmlFor="bm-name">
              <Input
                id="bm-name"
                placeholder="ex.: ROI médio do setor de formação — Angola"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Tipo *" htmlFor="bm-type">
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType(v as BenchmarkType)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Fonte *" htmlFor="bm-source">
            <Input
              id="bm-source"
              placeholder="ex.: Associação Angolana de RH, benchmark interno do RH…"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Ano de referência *" htmlFor="bm-year">
              <Input
                id="bm-year"
                type="number"
                value={referenceYear}
                onChange={(e) => setReferenceYear(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Valor *" htmlFor="bm-value">
              <Input
                id="bm-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Unidade de medida *" htmlFor="bm-unit">
              <Input
                id="bm-unit"
                placeholder="ex.: %, AOA, dias…"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Aplicável a (KPI/indicador)" htmlFor="bm-indicator">
            <Input
              id="bm-indicator"
              placeholder="ex.: ROI médio anual, Taxa de rotatividade…"
              value={indicatorName}
              onChange={(e) => setIndicatorName(e.target.value)}
              className="w-full"
            />
          </FormField>

          <FormField label="Observações" htmlFor="bm-observations">
            <Textarea
              id="bm-observations"
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full"
            />
          </FormField>
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
            {benchmark ? 'Guardar alterações' : 'Registar benchmark'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
