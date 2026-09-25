// components/roi-impact/NewScenarioModal.tsx
// "Novo Cenário" (docs/roi-impact.md §8) — simula o impacto financeiro de
// uma iniciativa futura ainda não executada. O benefício esperado vem OU de
// uma análise de ROI semelhante já medida (o backend deriva o valor do BCR
// dessa análise) OU de uma premissa manual — nunca os dois em simultâneo.

'use client';

import { useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/Textarea';
import { fmt$, INITIATIVE_TYPE_LABELS, SCENARIO_CASE_LABELS } from './utils';
import type { RoiAnalysisListData, RoiInitiativeType, ScenarioProjections } from './types';

const INITIATIVE_TYPE_ITEMS = Object.entries(INITIATIVE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export interface NewScenarioModalProps {
  onClose: () => void;
}

export function NewScenarioModal({ onClose }: NewScenarioModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [initiativeType, setInitiativeType] = useState<RoiInitiativeType>('CURSO');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [targetAudienceCount, setTargetAudienceCount] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [benefitSource, setBenefitSource] = useState<'manual' | 'analysis'>('manual');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [basedOnAnalysisId, setBasedOnAnalysisId] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [preview, setPreview] = useState<{
    roiPercent: number | null;
    paybackMonths: number | null;
    note: string | null;
    projections: ScenarioProjections | null;
  } | null>(null);

  const { data: deptTree } = useApiQuery<{ id: number; name: string; children?: unknown[] }[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const departments = useMemo(() => {
    const flat: { id: number; name: string }[] = [];
    const walk = (nodes: typeof deptTree) => {
      for (const n of nodes ?? []) {
        flat.push({ id: n.id, name: n.name });
        walk(n.children as typeof deptTree);
      }
    };
    walk(deptTree);
    return flat;
  }, [deptTree]);

  const { data: analysesData } = useApiQuery<RoiAnalysisListData>(
    queryKeys.roiImpact.analyses(),
    '/roi-impact/analyses',
    { staleTime: STALE_TIME.DYNAMIC, enabled: benefitSource === 'analysis' },
  );
  const measuredAnalyses = (analysesData?.analyses ?? []).filter((a) => a.realizedBenefit != null);

  const create = useApiMutation(
    () =>
      apiClient.post<{
        roiPercent: number | null;
        paybackMonths: number | null;
        note: string | null;
        projections: ScenarioProjections | null;
      }>('/roi-impact/scenarios', {
        name: name.trim(),
        initiativeType,
        description: description.trim() || undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        targetAudienceCount: targetAudienceCount ? Number(targetAudienceCount) : undefined,
        estimatedCost: Number(estimatedCost),
        expectedBenefit:
          benefitSource === 'manual' && expectedBenefit ? Number(expectedBenefit) : undefined,
        basedOnAnalysisId:
          benefitSource === 'analysis' && basedOnAnalysisId ? Number(basedOnAnalysisId) : undefined,
        assumptions: assumptions.trim() || undefined,
      }),
    {
      invalidateKeys: [queryKeys.roiImpact.scenarios()],
      onSuccess: (created) => {
        setPreview({
          roiPercent: created.roiPercent,
          paybackMonths: created.paybackMonths,
          note: created.note,
          projections: created.projections,
        });
        notify({ title: 'Cenário criado', intent: 'success' });
      },
      onError: (e) => setError(e.message || 'Erro ao criar o cenário.'),
    },
  );

  const canSubmit =
    name.trim() &&
    estimatedCost &&
    (benefitSource === 'manual' ? true : !!basedOnAnalysisId);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Cenário"
        description="Simula o impacto financeiro de uma decisão futura de investimento — docs/roi-impact.md §8"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        {!preview ? (
          <div className="space-y-4">
            <FormField label="Nome do cenário *" htmlFor="sc-name">
              <Input
                id="sc-name"
                placeholder="ex.: Formação presencial para 40 gestores de loja"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipo de iniciativa proposta" htmlFor="sc-type">
                <Select
                  items={INITIATIVE_TYPE_ITEMS}
                  value={initiativeType}
                  onValueChange={(v) => setInitiativeType(v as RoiInitiativeType)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Departamento (público-alvo)" htmlFor="sc-dept">
                <Select
                  items={departments.map((d) => ({ value: String(d.id), label: d.name }))}
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  placeholder="Selecionar…"
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nº de colaboradores (público-alvo)" htmlFor="sc-audience">
                <Input
                  id="sc-audience"
                  type="number"
                  min={0}
                  value={targetAudienceCount}
                  onChange={(e) => setTargetAudienceCount(e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Custo estimado (AOA) *" htmlFor="sc-cost">
                <Input
                  id="sc-cost"
                  type="number"
                  min={0}
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <FormField label="Descrição" htmlFor="sc-description">
              <Textarea
                id="sc-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
            </FormField>

            <div className="rounded-card border border-border p-3">
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Benefício esperado
              </p>
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBenefitSource('manual')}
                  className={
                    'rounded-control border px-3 py-1.5 text-xs font-medium transition-colors ' +
                    (benefitSource === 'manual'
                      ? 'border-primary bg-accent-subtle text-ink'
                      : 'border-border text-ink-faint')
                  }
                >
                  Premissa manual
                </button>
                <button
                  type="button"
                  onClick={() => setBenefitSource('analysis')}
                  className={
                    'rounded-control border px-3 py-1.5 text-xs font-medium transition-colors ' +
                    (benefitSource === 'analysis'
                      ? 'border-primary bg-accent-subtle text-ink'
                      : 'border-border text-ink-faint')
                  }
                >
                  Basear em análise semelhante
                </button>
              </div>

              {benefitSource === 'manual' ? (
                <FormField label="Benefício esperado (AOA, em 12 meses)" htmlFor="sc-benefit">
                  <Input
                    id="sc-benefit"
                    type="number"
                    min={0}
                    value={expectedBenefit}
                    onChange={(e) => setExpectedBenefit(e.target.value)}
                    className="w-full"
                  />
                </FormField>
              ) : (
                <FormField label="Análise de ROI semelhante (já medida) *" htmlFor="sc-analysis">
                  <Select
                    items={measuredAnalyses.map((a) => ({
                      value: String(a.id),
                      label: `${a.name} — BCR ${
                        a.totalCost > 0 ? (a.realizedBenefit! / a.totalCost).toFixed(2) : '—'
                      }`,
                    }))}
                    value={basedOnAnalysisId}
                    onValueChange={setBasedOnAnalysisId}
                    placeholder={
                      measuredAnalyses.length === 0
                        ? 'Sem análises já calculadas disponíveis'
                        : 'Selecionar…'
                    }
                    className="w-full"
                  />
                </FormField>
              )}
              <p className="mt-2 font-body text-[11px] text-ink-faint">
                O benefício projectado é escalado pelo rácio benefício/custo (BCR) da análise
                escolhida sobre o custo estimado deste cenário.
              </p>
            </div>

            <FormField label="Premissas assumidas" htmlFor="sc-assumptions">
              <Textarea
                id="sc-assumptions"
                rows={2}
                value={assumptions}
                onChange={(e) => setAssumptions(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-card border border-border bg-surface-sunken p-3">
                <p className="text-ink-faint text-xs">ROI projectado (Realista)</p>
                <p className="font-display text-xl font-bold text-ink">
                  {preview.roiPercent != null ? `${preview.roiPercent}%` : '—'}
                </p>
              </div>
              <div className="rounded-card border border-border bg-surface-sunken p-3">
                <p className="text-ink-faint text-xs">Payback projectado</p>
                <p className="font-display text-xl font-bold text-ink">
                  {preview.paybackMonths != null ? `${preview.paybackMonths} meses` : '—'}
                </p>
              </div>
            </div>

            {preview.projections ? (
              <div className="overflow-x-auto rounded-card border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-sunken text-left text-xs text-ink-faint">
                      <th className="px-3 py-2">Cenário</th>
                      <th className="px-3 py-2">Custo</th>
                      <th className="px-3 py-2">Benefício</th>
                      <th className="px-3 py-2">ROI</th>
                      <th className="px-3 py-2">Payback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(preview.projections) as (keyof ScenarioProjections)[]).map((k) => {
                      const p = preview.projections![k];
                      return (
                        <tr key={k} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium text-ink">{SCENARIO_CASE_LABELS[k]}</td>
                          <td className="px-3 py-2 text-ink">{fmt$(p.cost)}</td>
                          <td className="px-3 py-2 text-ink">{fmt$(p.benefit)}</td>
                          <td className="px-3 py-2 text-ink">{p.roiPercent}%</td>
                          <td className="px-3 py-2 text-ink">
                            {p.paybackMonths != null ? `${p.paybackMonths} meses` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-card bg-warning-subtle p-3 text-xs text-warning-ink">
                {preview.note ?? 'Sem benefício esperado — projecção indisponível.'}
              </p>
            )}

            {preview.note && preview.projections && (
              <p className="rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-faint">
                {preview.note}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="justify-center" onClick={onClose} disabled={create.isPending}>
            {preview ? 'Fechar' : 'Cancelar'}
          </Button>
          {!preview && (
            <Button
              className="flex-1 justify-center"
              onClick={() => create.mutate(undefined)}
              loading={create.isPending}
              disabled={!canSubmit}
            >
              Criar cenário
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
