// components/departments/PositionFormModal.tsx
// Modal "Novo cargo" do separador "Cargos & Funções"
// (docs/modulo_departments.md Ponto 6). Distinto de
// o antigo CreatePositionModal (separador Cargos do
// módulo Organização): ambos escrevem na mesma tabela Position via DTOs
// diferentes, mas só este expõe os campos do Ponto 6 (função, família
// profissional, responsabilidades/requisitos, formação/experiência
// necessárias, reporte hierárquico, estado).
//
// Backend: POST /positions exige @Roles(ADMIN, RH). Nome único
// (case-insensitive) por departamento → 409 (mostrado inline).

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { LEVEL_CFG } from './constants';
import type { PosLevel } from './types';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { DepartmentNode, PositionRow } from './types';
import { MultiCombobox } from '@/components/ui/MultiCombobox';
import { ChoiceOrManualField, ItemListPicker } from './PositionFormFields';
import {
  JOB_FAMILIES,
  JOB_FUNCTION_NAMES,
  findJobFunction,
} from './positionCatalog';

export interface PositionFormModalProps {
  onClose: () => void;
}

const NO_DEPT = 'NONE';
const NO_REPORTS_TO = 'NONE';

const LEVEL_ITEMS: SelectItemOption[] = (
  Object.keys(LEVEL_CFG) as PosLevel[]
).map((lvl) => ({
  value: lvl,
  label: LEVEL_CFG[lvl].label,
}));

const ACTIVE_ITEMS: SelectItemOption[] = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface PositionFormModalFormValues {
  name: string;
  code: string;
  jobFunctions: string[];
  jobFamily: string;
  level: PosLevel | '';
  departmentId: string;
  reportsToPositionId: string;
  description: string;
  responsibilityItems: Record<string, string[]>;
  requirementItems: Record<string, string[]>;
  requiredTraining: string;
  requiredExperience: string;
  salaryMin: string;
  salaryMax: string;
  headcountPlanned: string;
  active: string;
  submitError: string;
}

export function PositionFormModal({ onClose }: PositionFormModalProps) {
  const notify = useToast();

  const { values: formValues, set: setField } =
    useFormState<PositionFormModalFormValues>({
      name: '',
      code: '',
      jobFunctions: [],
      jobFamily: '',
      level: '',
      departmentId: NO_DEPT,
      reportsToPositionId: NO_REPORTS_TO,
      description: '',
      responsibilityItems: {},
      requirementItems: {},
      requiredTraining: '',
      requiredExperience: '',
      salaryMin: '',
      salaryMax: '',
      headcountPlanned: '',
      active: 'true',
      submitError: '',
    });
  const {
    name,
    code,
    jobFunctions,
    jobFamily,
    level,
    departmentId,
    reportsToPositionId,
    description,
    responsibilityItems,
    requirementItems,
    requiredTraining,
    requiredExperience,
    salaryMin,
    salaryMax,
    headcountPlanned,
    active,
    submitError,
  } = formValues;

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: positionsResp } = useApiQuery<{ data: PositionRow[] }>(
    queryKeys.departments.positions({ limit: 200 }),
    '/departments/positions',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const deptItems = [
    { value: NO_DEPT, label: 'Sem departamento' },
    ...flattenTree(tree ?? []),
  ];
  const reportsToItems = [
    { value: NO_REPORTS_TO, label: 'Nenhum (topo da hierarquia)' },
    ...(positionsResp?.data ?? []).map((p) => ({
      value: String(p.id),
      label: p.name,
    })),
  ];

  // Ao mudar as funções: se a família estiver vazia, usa a habitual da
  // primeira função escolhida. As listas de cada função são independentes.
  const handleFunctionsChange = (next: string[]) => {
    setField('jobFunctions', next);
    const first = next.length ? findJobFunction(next[0]) : undefined;
    if (first && !jobFamily.trim()) setField('jobFamily', first.family);
  };

  const setItems = (
    key: 'responsibilityItems' | 'requirementItems',
    fn: string,
    items: string[],
  ) =>
    setField(key, {
      ...(key === 'responsibilityItems'
        ? responsibilityItems
        : requirementItems),
      [fn]: items,
    });

  // Com uma só função guarda-se uma linha por item; com várias, agrupa-se
  // por função ("Função:" + itens com traço).
  const NL = String.fromCharCode(10);
  const joinByFunction = (byFn: Record<string, string[]>) => {
    const used = jobFunctions.filter((f) => (byFn[f] ?? []).length > 0);
    if (jobFunctions.length <= 1) return used.flatMap((f) => byFn[f]).join(NL);
    return used
      .map((f) => `${f}:${NL}${byFn[f].map((i) => `- ${i}`).join(NL)}`)
      .join(NL + NL);
  };
  const responsibilitiesText = joinByFunction(responsibilityItems);
  const requirementsText = joinByFunction(requirementItems);

  const min = salaryMin.trim() ? Number(salaryMin) : null;
  const max = salaryMax.trim() ? Number(salaryMax) : null;
  const salaryInvalid =
    min != null &&
    max != null &&
    !Number.isNaN(min) &&
    !Number.isNaN(max) &&
    min > max;

  const canSubmit = name.trim().length > 0 && !salaryInvalid;

  const createPos = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/positions', body),
    {
      invalidateKeys: [queryKeys.departments.all],
      onSuccess: () => {
        notify({ title: 'Cargo criado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao criar o cargo. Tente novamente.',
        ),
    },
  );
  const loading = createPos.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    createPos.mutate({
      name: name.trim(),
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(jobFunctions.length ? { jobFunction: jobFunctions.join(', ') } : {}),
      ...(jobFamily.trim() ? { jobFamily: jobFamily.trim() } : {}),
      ...(level ? { level } : {}),
      ...(departmentId !== NO_DEPT
        ? { departmentId: Number(departmentId) }
        : {}),
      ...(reportsToPositionId !== NO_REPORTS_TO
        ? { reportsToPositionId: Number(reportsToPositionId) }
        : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(responsibilitiesText
        ? { responsibilities: responsibilitiesText }
        : {}),
      ...(requirementsText ? { requirements: requirementsText } : {}),
      ...(requiredTraining.trim()
        ? { requiredTraining: requiredTraining.trim() }
        : {}),
      ...(requiredExperience.trim()
        ? { requiredExperience: requiredExperience.trim() }
        : {}),
      ...(min != null && !Number.isNaN(min) ? { salaryMin: min } : {}),
      ...(max != null && !Number.isNaN(max) ? { salaryMax: max } : {}),
      ...(headcountPlanned.trim()
        ? { headcountPlanned: Number(headcountPlanned) }
        : {}),
      active: active === 'true',
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo cargo"
        description="Cria um cargo dentro de um departamento, com função, requisitos e posição na hierarquia."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <Section title="Identificação">
            <FormField label="Cargo *" htmlFor="pf-name">
              <Input
                id="pf-name"
                value={name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Ex.: Analista de Recursos Humanos"
                maxLength={120}
              />
            </FormField>

            <FormField label="Código do cargo" htmlFor="pf-code">
              <Input
                id="pf-code"
                value={code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="Ex.: RH-AN-01"
                maxLength={30}
              />
            </FormField>

            <FormField
              label="Funções"
              htmlFor="pf-function"
              hint="Podes escolher várias."
            >
              <MultiCombobox
                items={JOB_FUNCTION_NAMES.map((n) => ({ value: n, label: n }))}
                value={jobFunctions}
                onValueChange={handleFunctionsChange}
                label="Seleccionar funções"
                searchPlaceholder="Escreva para filtrar…"
              />
            </FormField>

            <FormField label="Família profissional" htmlFor="pf-family">
              <ChoiceOrManualField
                id="pf-family"
                options={JOB_FAMILIES}
                value={jobFamily}
                onChange={(v) => setField('jobFamily', v)}
                placeholder="Seleccionar família…"
                manualPlaceholder="Ex.: Recursos Humanos"
                maxLength={100}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Descrição da função" htmlFor="pf-description">
                <Textarea
                  id="pf-description"
                  value={description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Opcional — resumo do propósito do cargo."
                  rows={2}
                  className="w-full"
                />
              </FormField>
            </div>
          </Section>

          <Section title="Hierarquia e departamento">
            <FormField label="Departamento" htmlFor="pf-dept">
              <Select
                items={deptItems}
                value={departmentId}
                onValueChange={(v) => setField('departmentId', v)}
                className="w-full"
              />
            </FormField>

            <FormField label="Nível hierárquico" htmlFor="pf-level">
              <Select
                items={LEVEL_ITEMS}
                value={level || undefined}
                onValueChange={(v) => setField('level', v as PosLevel)}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>

            <FormField
              label="Responsável hierárquico (reporta a)"
              htmlFor="pf-reports-to"
            >
              <Select
                items={reportsToItems}
                value={reportsToPositionId}
                onValueChange={(v) => setField('reportsToPositionId', v)}
                className="w-full"
              />
            </FormField>

            <FormField label="Estado" htmlFor="pf-active">
              <Select
                items={ACTIVE_ITEMS}
                value={active}
                onValueChange={(v) => setField('active', v)}
                className="w-full"
              />
            </FormField>
          </Section>

          <Section title="Responsabilidades e requisitos">
            {jobFunctions.length === 0 && (
              <p className="text-xs text-ink-faint sm:col-span-2">
                Escolha primeiro as funções para ver as responsabilidades e os
                requisitos sugeridos de cada uma.
              </p>
            )}
            {jobFunctions.map((fn) => {
              const template = findJobFunction(fn);
              return (
                <div
                  key={fn}
                  className="flex flex-col gap-4 rounded-card border border-border p-4 sm:col-span-2"
                >
                  <h4 className="font-body text-sm font-semibold text-ink">
                    {fn}
                  </h4>
                  <FormField
                    label="Responsabilidades"
                    htmlFor={`pf-resp-${fn}`}
                  >
                    <ItemListPicker
                      suggestions={template?.responsibilities ?? []}
                      value={responsibilityItems[fn] ?? []}
                      onChange={(v) => setItems('responsibilityItems', fn, v)}
                      addPlaceholder="Escrever uma responsabilidade e adicionar"
                      emptyHint="Sem sugestões para esta função — escreva as suas."
                    />
                  </FormField>
                  <FormField label="Requisitos" htmlFor={`pf-req-${fn}`}>
                    <ItemListPicker
                      suggestions={template?.requirements ?? []}
                      value={requirementItems[fn] ?? []}
                      onChange={(v) => setItems('requirementItems', fn, v)}
                      addPlaceholder="Escrever um requisito e adicionar"
                      emptyHint="Sem sugestões para esta função — escreva os seus."
                    />
                  </FormField>
                </div>
              );
            })}
            <FormField label="Formação necessária" htmlFor="pf-training">
              <Input
                id="pf-training"
                value={requiredTraining}
                onChange={(e) => setField('requiredTraining', e.target.value)}
                placeholder="Ex.: Licenciatura em Gestão de RH"
              />
            </FormField>
            <FormField label="Experiência necessária" htmlFor="pf-experience">
              <Input
                id="pf-experience"
                value={requiredExperience}
                onChange={(e) => setField('requiredExperience', e.target.value)}
                placeholder="Ex.: 2 anos em função semelhante"
              />
            </FormField>
          </Section>

          <Section title="Posições e estrutura salarial">
            <FormField label="Nº de posições planeado" htmlFor="pf-headcount">
              <Input
                id="pf-headcount"
                type="number"
                min={0}
                value={headcountPlanned}
                onChange={(e) => setField('headcountPlanned', e.target.value)}
                placeholder="1"
              />
            </FormField>
            <div />
            <FormField
              label="Salário mín. (AOA)"
              htmlFor="pf-salary-min"
              error={salaryInvalid ? 'Deve ser ≤ ao máx.' : undefined}
            >
              <Input
                id="pf-salary-min"
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setField('salaryMin', e.target.value)}
                invalid={salaryInvalid}
              />
            </FormField>
            <FormField label="Salário máx. (AOA)" htmlFor="pf-salary-max">
              <Input
                id="pf-salary-max"
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => setField('salaryMax', e.target.value)}
              />
            </FormField>
          </Section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar cargo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
