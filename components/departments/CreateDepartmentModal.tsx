// components/departments/CreateDepartmentModal.tsx
// Modal "Novo departamento" — usado pelo módulo Departamentos
// (app/(platform)/departments). A página só monta o componente quando está
// aberto, por isso o Modal fica sempre `open` e delega o fecho em `onClose`.
//
// Backend: POST exige @Roles(ADMIN, RH) nos dois módulos. Código único →
// 409 (mostrado inline). A lista de pais vem de /departments/tree e a de
// unidades de /units (ambos apenas activos/accessíveis a qualquer
// autenticado).

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle } from 'lucide-react';
import type { QueryKey } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { MultiCombobox } from '@/components/ui/MultiCombobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { DepartmentNode } from './types';
import { DepartmentUserPicker } from './DepartmentUserPicker';
import {
  COST_CENTER_OPTIONS,
  FUNCTIONAL_AREA_OPTIONS,
  OBJECTIVES_BY_AREA,
  RESPONSIBILITIES_BY_AREA,
} from './departmentOptions';
import { useUnits, type DirectoryUser } from './departmentFormData';

export interface CreateDepartmentModalProps {
  onClose: () => void;
  /** Endpoint de criação — difere entre os dois módulos. */
  endpoint: '/departments';
  /** Keys a invalidar após criar (lista/árvore de cada módulo). */
  invalidateKeys: QueryKey[];
  /**
   * Quando definido, o novo departamento fica preso a este pai (usado a
   * partir do detalhe para "Criar sub-departamento"): o campo pai é
   * pré-seleccionado e bloqueado.
   */
  defaultParentId?: number;
}

const NO_PARENT = 'NONE';
const NO_UNIT = 'NONE';
const DEFAULT_COLOR = '#1a4bb5';
const NL = String.fromCharCode(10);

const STATUS_ITEMS: SelectItemOption[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

const STRATEGIC_ITEMS: SelectItemOption[] = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' },
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

interface CreateDepartmentModalFormValues {
  name: string;
  code: string;
  description: string;
  parentId: string;
  unitId: string;
  location: string;
  head: DirectoryUser | null;
  directManager: DirectoryUser | null;
  costCenter: string;
  annualBudget: string;
  maxEmployees: string;
  expectedEmployees: string;
  status: string;
  operationalStartDate: string;
  institutionalEmail: string;
  phoneExtension: string;
  physicalLocation: string;
  objective: string;
  objectivePicks: Record<string, string[]>;
  mainResponsibilities: string;
  functionalAreas: string[];
  responsibilityPicks: Record<string, string[]>;
  isStrategic: string;
  notes: string;
  color: string;
  submitError: string;
}

export function CreateDepartmentModal({
  onClose,
  endpoint,
  invalidateKeys,
  defaultParentId,
}: CreateDepartmentModalProps) {
  const notify = useToast();

  const parentLocked = defaultParentId != null;

  const { values: formValues, set: setField } =
    useFormState<CreateDepartmentModalFormValues>({
      name: '',
      code: '',
      description: '',
      parentId: parentLocked ? String(defaultParentId) : NO_PARENT,
      unitId: NO_UNIT,
      location: '',
      head: null,
      directManager: null,
      costCenter: '',
      annualBudget: '',
      maxEmployees: '',
      expectedEmployees: '',
      status: 'ACTIVE',
      operationalStartDate: '',
      institutionalEmail: '',
      phoneExtension: '',
      physicalLocation: '',
      objective: '',
      objectivePicks: {},
      mainResponsibilities: '',
      functionalAreas: [],
      responsibilityPicks: {},
      isStrategic: 'false',
      notes: '',
      color: DEFAULT_COLOR,
      submitError: '',
    });
  const {
    name,
    code,
    description,
    parentId,
    unitId,
    location,
    head,
    directManager,
    costCenter,
    annualBudget,
    maxEmployees,
    expectedEmployees,
    status,
    operationalStartDate,
    institutionalEmail,
    phoneExtension,
    physicalLocation,
    objective,
    objectivePicks,
    mainResponsibilities,
    functionalAreas,
    responsibilityPicks,
    isStrategic,
    notes,
    color,
    submitError,
  } = formValues;

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { units } = useUnits();

  const parentItems = [
    { value: NO_PARENT, label: 'Sem departamento pai (raiz)' },
    ...flattenTree(tree ?? []),
  ];
  const unitItems = [
    { value: NO_UNIT, label: 'Sem unidade/empresa associada' },
    ...units.map((u) => ({
      value: String(u.id),
      label: `${u.name} (${u.code})`,
    })),
  ];

  const canSubmit = name.trim().length > 0 && code.trim().length > 0;

  const createDept = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post(endpoint, body),
    {
      invalidateKeys,
      onSuccess: () => {
        notify({ title: 'Departamento criado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao criar o departamento. Tente novamente.',
        ),
    },
  );
  const loading = createDept.isPending;

  // Objectivo = opções marcadas + texto manual (uma por linha).
  const objectiveText = [
    ...functionalAreas.flatMap((a) => objectivePicks[a] ?? []),
    objective.trim(),
  ]
    .filter(Boolean)
    .join(NL);
  // Responsabilidades = por cada área seleccionada, as opções marcadas
  // (agrupadas sob o nome da área) + texto manual no fim.
  const responsibilitiesText = [
    ...functionalAreas
      .filter((a) => (responsibilityPicks[a] ?? []).length > 0)
      .map(
        (a) =>
          `${a}:${NL}${responsibilityPicks[a].map((r) => `- ${r}`).join(NL)}`,
      ),
    mainResponsibilities.trim(),
  ]
    .filter(Boolean)
    .join(NL + NL);

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    createDept.mutate({
      name: name.trim(),
      code: code.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(parentId !== NO_PARENT ? { parentId: Number(parentId) } : {}),
      ...(unitId !== NO_UNIT ? { unitId: Number(unitId) } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(head ? { headId: head.id } : {}),
      ...(directManager ? { directManagerId: directManager.id } : {}),
      ...(costCenter.trim() ? { costCenter: costCenter.trim() } : {}),
      ...(annualBudget.trim() ? { annualBudget: Number(annualBudget) } : {}),
      ...(maxEmployees.trim() ? { maxEmployees: Number(maxEmployees) } : {}),
      ...(expectedEmployees.trim()
        ? { expectedEmployees: Number(expectedEmployees) }
        : {}),
      status,
      ...(operationalStartDate ? { operationalStartDate } : {}),
      ...(institutionalEmail.trim()
        ? { institutionalEmail: institutionalEmail.trim() }
        : {}),
      ...(phoneExtension.trim()
        ? { phoneExtension: phoneExtension.trim() }
        : {}),
      ...(physicalLocation.trim()
        ? { physicalLocation: physicalLocation.trim() }
        : {}),
      ...(objectiveText ? { objective: objectiveText } : {}),
      ...(responsibilitiesText
        ? { mainResponsibilities: responsibilitiesText }
        : {}),
      ...(functionalAreas.length
        ? { functionalArea: functionalAreas.join(', ') }
        : {}),
      isStrategic: isStrategic === 'true',
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(color ? { color } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo departamento"
        description="Cria um departamento. Podes associá-lo a um departamento pai para formar a hierarquia."
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
            <FormField label="Nome *" htmlFor="cd-name">
              <Input
                id="cd-name"
                value={name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Ex.: Recursos Humanos"
                maxLength={120}
              />
            </FormField>

            <FormField label="Código *" htmlFor="cd-code" hint="Único.">
              <Input
                id="cd-code"
                value={code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="Ex.: RH-001"
                maxLength={20}
              />
            </FormField>

            <FormField
              label="Áreas funcionais"
              htmlFor="cd-functional-area"
              hint="Podes escolher várias."
            >
              <MultiCombobox
                items={FUNCTIONAL_AREA_OPTIONS}
                value={functionalAreas}
                onValueChange={(v) => setField('functionalAreas', v)}
                label="Selecionar áreas funcionais"
                searchPlaceholder="Escreva para filtrar…"
              />
            </FormField>

            <FormField label="Departamento estratégico" htmlFor="cd-strategic">
              <Select
                items={STRATEGIC_ITEMS}
                value={isStrategic}
                onValueChange={(v) => setField('isStrategic', v)}
                className="w-full"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Descrição" htmlFor="cd-description">
                <Textarea
                  id="cd-description"
                  value={description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Opcional — uma ou duas frases sobre o departamento."
                  rows={2}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Objectivo do departamento"
                htmlFor="cd-objective"
                hint={
                  functionalAreas.length === 0
                    ? 'Selecciona primeiro as áreas funcionais para ver a lista de cada uma.'
                    : 'Uma lista por área funcional; podes acrescentar texto manual.'
                }
              >
                <div className="flex flex-col gap-2">
                  {functionalAreas.map((area) => (
                    <MultiCombobox
                      key={area}
                      items={(OBJECTIVES_BY_AREA[area] ?? []).map((o) => ({
                        value: o,
                        label: o,
                      }))}
                      value={objectivePicks[area] ?? []}
                      onValueChange={(v) =>
                        setField('objectivePicks', {
                          ...objectivePicks,
                          [area]: v,
                        })
                      }
                      label={`Objectivos — ${area}`}
                      searchPlaceholder="Escreva para filtrar…"
                    />
                  ))}
                  <Textarea
                    id="cd-objective"
                    value={objective}
                    onChange={(e) => setField('objective', e.target.value)}
                    placeholder="Opcional — outro objectivo, escrito à mão."
                    rows={2}
                    className="w-full"
                  />
                </div>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Principais responsabilidades"
                htmlFor="cd-responsibilities"
                hint={
                  functionalAreas.length === 0
                    ? 'Selecciona primeiro as áreas funcionais para ver a lista de cada uma.'
                    : 'Uma lista por área funcional; podes acrescentar texto manual.'
                }
              >
                <div className="flex flex-col gap-2">
                  {functionalAreas.map((area) => (
                    <MultiCombobox
                      key={area}
                      items={(RESPONSIBILITIES_BY_AREA[area] ?? []).map(
                        (r) => ({ value: r, label: r }),
                      )}
                      value={responsibilityPicks[area] ?? []}
                      onValueChange={(v) =>
                        setField('responsibilityPicks', {
                          ...responsibilityPicks,
                          [area]: v,
                        })
                      }
                      label={`Responsabilidades — ${area}`}
                      searchPlaceholder="Escreva para filtrar…"
                    />
                  ))}
                  <Textarea
                    id="cd-responsibilities"
                    value={mainResponsibilities}
                    onChange={(e) =>
                      setField('mainResponsibilities', e.target.value)
                    }
                    placeholder="Opcional — outras responsabilidades, escritas à mão."
                    rows={2}
                    className="w-full"
                  />
                </div>
              </FormField>
            </div>
          </Section>

          <Section title="Hierarquia e responsáveis">
            <FormField
              label="Departamento pai"
              htmlFor="cd-parent"
              hint={
                parentLocked
                  ? 'Fixo — o novo departamento é criado como sub-departamento deste.'
                  : undefined
              }
            >
              <Select
                items={parentItems}
                value={parentId}
                onValueChange={(v) => setField('parentId', v)}
                disabled={parentLocked}
                className="w-full"
              />
            </FormField>

            <FormField label="Unidade/empresa" htmlFor="cd-unit">
              <Select
                items={unitItems}
                value={unitId}
                onValueChange={(v) => setField('unitId', v)}
                className="w-full"
              />
            </FormField>

            <DepartmentUserPicker
              label="Responsável pelo departamento"
              htmlFor="cd-head"
              value={head}
              onChange={(v) => setField('head', v)}
              excludeId={directManager?.id}
            />

            <DepartmentUserPicker
              label="Gestor directo"
              htmlFor="cd-direct-manager"
              value={directManager}
              onChange={(v) => setField('directManager', v)}
              excludeId={head?.id}
            />
          </Section>

          <Section title="Orçamento e capacidade">
            <FormField label="Centro de custo" htmlFor="cd-cost-center">
              <Combobox
                items={COST_CENTER_OPTIONS}
                value={costCenter || undefined}
                onValueChange={(v) => setField('costCenter', v)}
                placeholder="Selecionar centro de custo"
                searchPlaceholder="Escreva para filtrar ou indicar outro…"
                allowCustom
              />
            </FormField>

            <FormField label="Orçamento anual (AOA)" htmlFor="cd-budget">
              <Input
                id="cd-budget"
                type="number"
                min={0}
                value={annualBudget}
                onChange={(e) => setField('annualBudget', e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField
              label="Número máximo de colaboradores"
              htmlFor="cd-max-employees"
            >
              <Input
                id="cd-max-employees"
                type="number"
                min={0}
                value={maxEmployees}
                onChange={(e) => setField('maxEmployees', e.target.value)}
                placeholder="Ex.: 25"
              />
            </FormField>

            <FormField
              label="Número de colaboradores previsto"
              htmlFor="cd-expected-employees"
            >
              <Input
                id="cd-expected-employees"
                type="number"
                min={0}
                value={expectedEmployees}
                onChange={(e) => setField('expectedEmployees', e.target.value)}
                placeholder="Ex.: 20"
              />
            </FormField>

            <FormField label="Estado" htmlFor="cd-status">
              <Select
                items={STATUS_ITEMS}
                value={status}
                onValueChange={(v) => setField('status', v)}
                className="w-full"
              />
            </FormField>

            <FormField
              label="Data de início de funcionamento"
              htmlFor="cd-start-date"
            >
              <Input
                id="cd-start-date"
                type="date"
                value={operationalStartDate}
                onChange={(e) =>
                  setField('operationalStartDate', e.target.value)
                }
                className="w-full"
              />
            </FormField>
          </Section>

          <Section title="Contacto e localização">
            <FormField label="E-mail institucional" htmlFor="cd-email">
              <Input
                id="cd-email"
                type="email"
                value={institutionalEmail}
                onChange={(e) => setField('institutionalEmail', e.target.value)}
                placeholder="rh@empresa.com"
              />
            </FormField>

            <FormField label="Telefone/ramal" htmlFor="cd-phone">
              <Input
                id="cd-phone"
                value={phoneExtension}
                onChange={(e) => setField('phoneExtension', e.target.value)}
                placeholder="Ex.: 1234"
                maxLength={30}
              />
            </FormField>

            <FormField label="Localização" htmlFor="cd-location">
              <Input
                id="cd-location"
                value={location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="Ex.: Sede — Luanda"
                maxLength={150}
              />
            </FormField>

            <FormField
              label="Localização física"
              htmlFor="cd-physical-location"
            >
              <Input
                id="cd-physical-location"
                value={physicalLocation}
                onChange={(e) => setField('physicalLocation', e.target.value)}
                placeholder="Ex.: Edifício A, Piso 3, Sala 12"
              />
            </FormField>
          </Section>

          <Section title="Outros">
            <FormField label="Cor" htmlFor="cd-color">
              <div className="flex items-center gap-3">
                <input
                  id="cd-color"
                  type="color"
                  value={color}
                  onChange={(e) => setField('color', e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-control border border-border-strong bg-surface"
                />
                <Input
                  value={color}
                  onChange={(e) => setField('color', e.target.value)}
                  placeholder="#1a4bb5"
                  className="max-w-[140px]"
                />
              </div>
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Observações" htmlFor="cd-notes">
                <Textarea
                  id="cd-notes"
                  value={notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Opcional."
                  rows={2}
                  className="w-full"
                />
              </FormField>
            </div>
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
            Criar departamento
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
