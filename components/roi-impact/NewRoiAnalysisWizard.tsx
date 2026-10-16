// components/roi-impact/NewRoiAnalysisWizard.tsx
// "Nova Análise de ROI" — assistente de 5 etapas (docs/roi-impact.md §2:
// Identificação → Custos → Benefícios esperados → Metodologia → Resultado).
// Mesmo padrão de components/evaluation/NewEvaluationWizard.tsx.
//
// A iniciativa (Curso/Formação/Percurso/PDI/Mentoria/Evento) nunca é copiada
// para aqui — só se guarda `initiativeType`+`initiativeId`; o backend
// resolve o nome/participantes em runtime a partir da tabela de origem.

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Check,
  Clock,
  Info,
  Lightbulb,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { NavyPanel, NavyPanelRow } from './NavyPanel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { fmt$ } from './utils';
import {
  INITIATIVE_TYPE_LABELS,
  BENEFIT_TYPE_LABELS,
  CONFIDENCE_LABELS,
  ANALYSIS_STATUS_LABELS,
  DATA_SOURCES,
} from './utils';
import type {
  InitiativeOption,
  RoiInitiativeType,
  RoiBenefitType,
  RoiConfigData,
  KpiDefinitionRow,
  RoiEvaluationModelRow,
} from './types';

const STEPS = [
  { id: 'identification', label: 'Identificação' },
  { id: 'costs', label: 'Custos' },
  { id: 'benefits', label: 'Benefícios esperados' },
  { id: 'methodology', label: 'Metodologia' },
  { id: 'result', label: 'Resultado' },
] as const;

const INITIATIVE_TYPE_ITEMS = Object.entries(INITIATIVE_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
const BENEFIT_TYPE_ITEMS = Object.entries(BENEFIT_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
const DEFAULT_MEASUREMENT_PERIODS = [30, 60, 90, 180];

// O Select (Radix) não aceita itens com value '' — o "deixar em branco" usa
// este sentinela e é convertido de/para '' à entrada e saída do estado.
const BLANK = '__blank__';
const BLANK_LABEL = '— Deixar em branco —';
const blankItem = { value: BLANK, label: BLANK_LABEL };

const CONVERSION_METHODS = [
  'Horas poupadas × custo por hora',
  'Redução de custos operacionais',
  'Aumento de receita atribuível',
  'Redução de erros / retrabalho × custo unitário',
  'Redução de rotatividade × custo de substituição',
  'Redução de incidentes / acidentes × custo médio',
  'Valor de mercado / benchmark do setor',
  'Estimativa validada por gestor ou especialista',
];

const PHILLIPS_MODEL_NAME = 'Phillips ROI';

const ASSUMPTION_EXAMPLES = [
  'Os participantes mantêm a função durante todo o período de medição.',
  'O custo por hora médio é de X AOA, segundo a tabela salarial vigente.',
  '30% da melhoria observada é atribuída à formação (restante a outros fatores).',
  'A produtividade medida antes da iniciativa mantém-se estável sem intervenção.',
  'O benefício estimado foi validado pela Direção Financeira.',
];

const toItems = (list: string[]) => list.map((v) => ({ value: v, label: v }));

interface ComputeResult {
  computedCost: number | null;
  computedBenefit: number | null;
  roiPercent: number | null;
  bcr: number | null;
  paybackMonths: number | null;
  confidenceLevel: string | null;
  status: string;
}

export interface NewRoiAnalysisWizardProps {
  onClose: () => void;
}

export function NewRoiAnalysisWizard({ onClose }: NewRoiAnalysisWizardProps) {
  const notify = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [analysisId, setAnalysisId] = useState<number | null>(null);

  // Etapa 1 — Identificação
  const [name, setName] = useState('');
  const [initiativeType, setInitiativeType] =
    useState<RoiInitiativeType>('CURSO');
  const [initiativeId, setInitiativeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [unit, setUnit] = useState('');
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);
  const [referencePeriodStart, setReferencePeriodStart] = useState('');
  const [referencePeriodEnd, setReferencePeriodEnd] = useState('');
  const [measurementPeriodDays, setMeasurementPeriodDays] = useState('90');

  // Etapa 2 — Custos
  const [costDirect, setCostDirect] = useState('');
  const [costIndirect, setCostIndirect] = useState('');
  const [costOpportunity, setCostOpportunity] = useState('');

  // Etapa 3 — Benefícios esperados
  const [benefitType, setBenefitType] =
    useState<RoiBenefitType>('PRODUTIVIDADE');
  const [benefitIndicator, setBenefitIndicator] = useState('');
  const [benefitBaselineValue, setBenefitBaselineValue] = useState('');
  const [benefitExpectedValue, setBenefitExpectedValue] = useState('');
  const [benefitConversionNote, setBenefitConversionNote] = useState('');
  const [benefitValidator, setBenefitValidator] =
    useState<DirectoryUser | null>(null);

  // Etapa 4 — Metodologia
  const [evaluationModelUsed, setEvaluationModelUsed] = useState('');
  const [isolationFactor, setIsolationFactor] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [hasControlGroup, setHasControlGroup] = useState(false);
  const [assumptions, setAssumptions] = useState('');

  // Etapa 5 — Resultado
  const [monetaryBenefitOverride, setMonetaryBenefitOverride] = useState('');
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState<ComputeResult | null>(null);

  const { data: deptTree } = useApiQuery<
    {
      id: number;
      name: string;
      unit?: { id: number; name: string } | null;
      children?: unknown[];
    }[]
  >(queryKeys.departments.tree(), '/departments/tree', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const departments = useMemo(() => {
    const flat: {
      id: number;
      name: string;
      unit: { id: number; name: string } | null;
    }[] = [];
    const walk = (nodes: typeof deptTree) => {
      for (const n of nodes ?? []) {
        flat.push({ id: n.id, name: n.name, unit: n.unit ?? null });
        walk(n.children as typeof deptTree);
      }
    };
    walk(deptTree);
    return flat;
  }, [deptTree]);

  // Unidade: só a unidade associada ao departamento escolhido.
  const unitItems = useMemo(() => {
    const u = departments.find((d) => String(d.id) === departmentId)?.unit;
    return u ? [blankItem, { value: u.name, label: u.name }] : [];
  }, [departments, departmentId]);

  const { data: kpiData } = useApiQuery<{ kpis: KpiDefinitionRow[] }>(
    queryKeys.roiImpact.kpis(),
    '/roi-impact/kpis',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const indicatorItems = useMemo(
    () => [
      blankItem,
      ...(kpiData?.kpis ?? [])
        .filter((k) => k.status === 'ACTIVO')
        .map((k) => ({
          value: k.name,
          label: k.unit ? `${k.name} (${k.unit})` : k.name,
        })),
    ],
    [kpiData],
  );

  const { data: evalModels } = useApiQuery<RoiEvaluationModelRow[]>(
    queryKeys.roiImpact.evaluationModels(),
    '/roi-impact/evaluation-models',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const modelItems = useMemo(() => {
    const names = (evalModels ?? [])
      .filter((m) => m.status === 'ACTIVO')
      .map((m) => m.name);
    if (!names.includes(PHILLIPS_MODEL_NAME)) names.push(PHILLIPS_MODEL_NAME);
    return [blankItem, ...toItems(names)];
  }, [evalModels]);

  const { data: initiativeOptions } = useApiQuery<InitiativeOption[]>(
    queryKeys.roiImpact.initiativeOptions(initiativeType),
    '/roi-impact/analyses/initiative-options',
    { params: { type: initiativeType }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  // docs/roi-impact.md §11 "Configurações" — defaults do RH para esta
  // metodologia (fator de isolamento por tipo de iniciativa, períodos de
  // medição); nunca sobrepõe um valor que o utilizador já tenha editado.
  const { data: roiConfig } = useApiQuery<RoiConfigData>(
    queryKeys.roiImpact.config(),
    '/roi-impact/config',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const measurementPeriodItems = useMemo(
    () =>
      (roiConfig?.defaultMeasurementPeriods?.length
        ? roiConfig.defaultMeasurementPeriods
        : DEFAULT_MEASUREMENT_PERIODS
      ).map((d) => ({ value: String(d), label: `${d} dias` })),
    [roiConfig],
  );
  useEffect(() => {
    if (isolationFactor !== '') return;
    const preset = roiConfig?.defaultIsolationFactors?.[initiativeType];
    if (preset != null) setIsolationFactor(String(preset));
  }, [initiativeType, roiConfig, isolationFactor]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const stepIssues: string[] = (() => {
    if (current.id === 'identification') {
      const missing: string[] = [];
      if (!name.trim()) missing.push('nome');
      if (!initiativeId) missing.push('iniciativa');
      return missing.length ? [`Falta preencher: ${missing.join(', ')}`] : [];
    }
    return [];
  })();
  const canAdvance = stepIssues.length === 0;

  async function saveIdentification(): Promise<number> {
    const payload = {
      name: name.trim(),
      initiativeType,
      initiativeId: initiativeId ? Number(initiativeId) : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      unit: unit.trim() || undefined,
      responsibleId: responsible?.id,
      referencePeriodStart: referencePeriodStart || undefined,
      referencePeriodEnd: referencePeriodEnd || undefined,
      measurementPeriodDays: Number(measurementPeriodDays),
    };
    if (analysisId == null) {
      const created = await apiClient.post<{ id: number }>(
        '/roi-impact/analyses',
        payload,
      );
      setAnalysisId(created.id);
      return created.id;
    }
    await apiClient.patch(`/roi-impact/analyses/${analysisId}`, payload);
    return analysisId;
  }

  async function saveCosts(id: number) {
    await apiClient.patch(`/roi-impact/analyses/${id}`, {
      costDirect: costDirect ? Number(costDirect) : undefined,
      costIndirect: costIndirect ? Number(costIndirect) : undefined,
      costOpportunity: costOpportunity ? Number(costOpportunity) : undefined,
    });
  }

  async function saveBenefits(id: number) {
    await apiClient.patch(`/roi-impact/analyses/${id}`, {
      benefitType,
      benefitIndicator: benefitIndicator.trim() || undefined,
      benefitBaselineValue: benefitBaselineValue
        ? Number(benefitBaselineValue)
        : undefined,
      benefitExpectedValue: benefitExpectedValue
        ? Number(benefitExpectedValue)
        : undefined,
      benefitConversionNote: benefitConversionNote.trim() || undefined,
      benefitValidatorId: benefitValidator?.id,
    });
  }

  async function saveMethodology(id: number) {
    await apiClient.patch(`/roi-impact/analyses/${id}`, {
      evaluationModelUsed: evaluationModelUsed.trim() || undefined,
      isolationFactor: isolationFactor ? Number(isolationFactor) : undefined,
      dataSource: dataSource.trim() || undefined,
      hasControlGroup,
      assumptions: assumptions.trim() || undefined,
    });
  }

  const advance = async () => {
    if (!canAdvance || busy) return;
    setBusy(true);
    setError('');
    try {
      if (current.id === 'identification') {
        const id = await saveIdentification();
        setStep((s) => s + 1);
        void id;
      } else if (current.id === 'costs') {
        await saveCosts(analysisId!);
        setStep((s) => s + 1);
      } else if (current.id === 'benefits') {
        await saveBenefits(analysisId!);
        setStep((s) => s + 1);
      } else if (current.id === 'methodology') {
        await saveMethodology(analysisId!);
        setStep((s) => s + 1);
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.roiImpact.analyses() });
        qc.invalidateQueries({ queryKey: queryKeys.roiImpact.executive() });
        notify({ title: 'Análise de ROI guardada', intent: 'success' });
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar a análise.');
    } finally {
      setBusy(false);
    }
  };

  const compute = async () => {
    if (analysisId == null) return;
    setBusy(true);
    setError('');
    try {
      const computed = await apiClient.post<ComputeResult>(
        `/roi-impact/analyses/${analysisId}/compute`,
        {
          monetaryBenefitOverride: monetaryBenefitOverride
            ? Number(monetaryBenefitOverride)
            : undefined,
          observations: observations.trim() || undefined,
        },
      );
      setResult(computed);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao calcular o resultado.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Análise de ROI"
        description={`Etapa ${step + 1} de ${STEPS.length} — ${current.label}`}
        className="max-h-[90vh] max-w-2xl overflow-y-auto overflow-x-hidden"
      >
        <ol className="mt-4 mb-4 flex flex-wrap gap-1">
          {STEPS.map((s, i) => {
            const isCurrent = i === step;
            const done = i < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => i < step && setStep(i)}
                  title={`${i + 1}. ${s.label}`}
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] transition-colors disabled:cursor-not-allowed ' +
                    (isCurrent
                      ? 'bg-primary text-primary-fg ring-2 ring-primary/40'
                      : done
                        ? 'bg-success text-canvas'
                        : 'bg-surface-sunken text-ink-faint')
                  }
                >
                  {done && !isCurrent ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        {current.id === 'identification' && (
          <div className="space-y-4">
            <FormField label="Nome da análise *" htmlFor="ra-name">
              <Input
                id="ra-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
              <FormField label="Tipo de iniciativa" htmlFor="ra-type">
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
              <FormField label="Iniciativa associada *" htmlFor="ra-initiative">
                <Select
                  items={(initiativeOptions ?? []).map((o) => ({
                    value: String(o.id),
                    label: o.label,
                  }))}
                  value={initiativeId}
                  onValueChange={setInitiativeId}
                  placeholder="Selecionar…"
                  className="w-full"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
              <FormField label="Departamento" htmlFor="ra-dept">
                <Select
                  items={departments.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  }))}
                  value={departmentId}
                  onValueChange={(v) => {
                    setDepartmentId(v);
                    // Cada departamento tem no máximo uma unidade — pré-seleciona-a.
                    setUnit(
                      departments.find((d) => String(d.id) === v)?.unit?.name ??
                        '',
                    );
                  }}
                  placeholder="Selecionar…"
                  className="w-full"
                />
              </FormField>
              <FormField label="Unidade" htmlFor="ra-unit">
                <Select
                  items={unitItems}
                  value={unit}
                  onValueChange={(v) => setUnit(v === BLANK ? '' : v)}
                  placeholder={
                    departmentId
                      ? 'Departamento sem unidade'
                      : 'Escolha primeiro o departamento'
                  }
                  disabled={unitItems.length === 0}
                  className="w-full"
                />
              </FormField>
            </div>
            <DepartmentUserPicker
              label="Responsável"
              htmlFor="ra-responsible"
              value={responsible}
              onChange={setResponsible}
            />
            <div className="grid grid-cols-3 gap-3 [&>*]:min-w-0">
              <FormField
                label="Período de referência — início"
                htmlFor="ra-ref-start"
              >
                <Input
                  id="ra-ref-start"
                  type="date"
                  value={referencePeriodStart}
                  onChange={(e) => setReferencePeriodStart(e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField
                label="Período de referência — fim"
                htmlFor="ra-ref-end"
              >
                <Input
                  id="ra-ref-end"
                  type="date"
                  value={referencePeriodEnd}
                  onChange={(e) => setReferencePeriodEnd(e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Medição pós-iniciativa" htmlFor="ra-measure">
                <Select
                  items={measurementPeriodItems}
                  value={measurementPeriodDays}
                  onValueChange={setMeasurementPeriodDays}
                  className="w-full"
                />
              </FormField>
            </div>
          </div>
        )}

        {current.id === 'costs' && (
          <div className="space-y-4">
            <p className="text-xs text-ink-faint">
              Custos consolidados desta iniciativa —
              formador/material/plataforma/logística (diretos), horas
              perdidas/cobertura/coordenação (indiretos) e produção não
              realizada (oportunidade).
            </p>
            <FormField label="Custos diretos" htmlFor="ra-cost-direct">
              <Input
                id="ra-cost-direct"
                type="number"
                min={0}
                value={costDirect}
                onChange={(e) => setCostDirect(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Custos indiretos" htmlFor="ra-cost-indirect">
              <Input
                id="ra-cost-indirect"
                type="number"
                min={0}
                value={costIndirect}
                onChange={(e) => setCostIndirect(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Custos de oportunidade"
              htmlFor="ra-cost-opportunity"
            >
              <Input
                id="ra-cost-opportunity"
                type="number"
                min={0}
                value={costOpportunity}
                onChange={(e) => setCostOpportunity(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        )}

        {current.id === 'benefits' && (
          <div className="space-y-4">
            <FormField label="Tipo de benefício" htmlFor="ra-benefit-type">
              <Select
                items={BENEFIT_TYPE_ITEMS}
                value={benefitType}
                onValueChange={(v) => setBenefitType(v as RoiBenefitType)}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Indicador associado"
              htmlFor="ra-benefit-indicator"
            >
              <Select
                items={indicatorItems}
                value={benefitIndicator}
                onValueChange={(v) => setBenefitIndicator(v === BLANK ? '' : v)}
                placeholder="Selecionar um KPI…"
                className="w-full"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
              <FormField
                label="Valor de referência (antes)"
                htmlFor="ra-benefit-before"
              >
                <Input
                  id="ra-benefit-before"
                  type="number"
                  value={benefitBaselineValue}
                  onChange={(e) => setBenefitBaselineValue(e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField
                label="Valor esperado (depois)"
                htmlFor="ra-benefit-after"
              >
                <Input
                  id="ra-benefit-after"
                  type="number"
                  value={benefitExpectedValue}
                  onChange={(e) => setBenefitExpectedValue(e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>
            <FormField
              label="Forma de conversão em valor monetário"
              htmlFor="ra-benefit-note"
            >
              <Select
                items={[blankItem, ...toItems(CONVERSION_METHODS)]}
                value={benefitConversionNote}
                onValueChange={(v) =>
                  setBenefitConversionNote(v === BLANK ? '' : v)
                }
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
            <DepartmentUserPicker
              label="Responsável pela validação"
              htmlFor="ra-benefit-validator"
              value={benefitValidator}
              onChange={setBenefitValidator}
            />
          </div>
        )}

        {current.id === 'methodology' && (
          <div className="space-y-4">
            <FormField label="Modelo de avaliação utilizado" htmlFor="ra-model">
              <Select
                items={modelItems}
                value={evaluationModelUsed}
                onValueChange={(v) =>
                  setEvaluationModelUsed(v === BLANK ? '' : v)
                }
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
            <FormField label="Fator de isolamento (0–1)" htmlFor="ra-isolation">
              <Input
                id="ra-isolation"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={isolationFactor}
                onChange={(e) => setIsolationFactor(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Fonte de dados" htmlFor="ra-source">
              <Select
                items={[blankItem, ...toItems(DATA_SOURCES)]}
                value={dataSource}
                onValueChange={(v) => setDataSource(v === BLANK ? '' : v)}
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={hasControlGroup}
                onChange={(e) => setHasControlGroup(e.target.checked)}
              />
              Existe grupo de controlo
            </label>
            <FormField label="Premissas assumidas" htmlFor="ra-assumptions">
              <Textarea
                id="ra-assumptions"
                rows={2}
                value={assumptions}
                onChange={(e) => setAssumptions(e.target.value)}
                className="w-full"
              />
            </FormField>
            <div className="rounded-card bg-surface-sunken p-3 text-xs text-ink-faint">
              <p className="mb-1 font-medium text-ink-muted">
                Exemplos do que preencher:
              </p>
              <ul className="list-disc space-y-0.5 pl-4">
                {ASSUMPTION_EXAMPLES.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {current.id === 'result' && (
          <div className="space-y-4">
            <FormField
              label="Benefício monetário validado"
              htmlFor="ra-benefit-override"
            >
              <Input
                id="ra-benefit-override"
                type="number"
                min={0}
                placeholder="Valor em AOA já convertido/validado com Finanças"
                value={monetaryBenefitOverride}
                onChange={(e) => setMonetaryBenefitOverride(e.target.value)}
                className="w-full"
              />
            </FormField>
            <p className="text-xs text-ink-faint">
              Sem um valor monetário validado, a análise fica &quot;Dados
              insuficientes&quot; em vez de apresentar um ROI como número
              definitivo.
            </p>
            <Button
              type="button"
              intent="secondary"
              onClick={compute}
              loading={busy}
            >
              Calcular resultado
            </Button>

            {result && (
              <NavyPanel title="Resultado da análise" icon={Lightbulb}>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <NavyPanelRow icon={Wallet}>
                    Custo total:{' '}
                    <strong>
                      {result.computedCost != null
                        ? fmt$(result.computedCost)
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow icon={TrendingUp}>
                    Benefício:{' '}
                    <strong>
                      {result.computedBenefit != null
                        ? fmt$(result.computedBenefit)
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow icon={BarChart3}>
                    ROI:{' '}
                    <strong>
                      {result.roiPercent != null
                        ? `${result.roiPercent}%`
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow icon={Clock}>
                    Payback:{' '}
                    <strong>
                      {result.paybackMonths != null
                        ? `${result.paybackMonths} meses`
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow
                    icon={
                      result.status === 'DADOS_INSUFICIENTES'
                        ? TriangleAlert
                        : Info
                    }
                    iconClassName={
                      result.status === 'DADOS_INSUFICIENTES'
                        ? 'text-[#FBBF24]'
                        : 'text-[#7CC4FF]'
                    }
                  >
                    Estado:{' '}
                    <strong>
                      {ANALYSIS_STATUS_LABELS[result.status] ?? result.status}
                    </strong>
                  </NavyPanelRow>
                  {result.confidenceLevel && (
                    <NavyPanelRow icon={Info}>
                      Confiança:{' '}
                      <strong>
                        {CONFIDENCE_LABELS[result.confidenceLevel] ??
                          result.confidenceLevel}
                      </strong>
                    </NavyPanelRow>
                  )}
                </ul>
              </NavyPanel>
            )}

            <FormField label="Observações" htmlFor="ra-observations">
              <Textarea
                id="ra-observations"
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="justify-center"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            disabled={busy}
          >
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={advance}
            loading={busy}
            disabled={!canAdvance}
          >
            {isLast ? 'Concluir' : 'Continuar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
