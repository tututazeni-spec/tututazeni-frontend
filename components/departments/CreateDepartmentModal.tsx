// components/departments/CreateDepartmentModal.tsx
// Modal "Novo departamento" — partilhado pelo módulo Departamentos
// (app/(platform)/departments) e pelo separador Departamentos do Organograma
// (app/(platform)/organization). A página só monta o componente quando está
// aberto, por isso o Modal fica sempre `open` e delega o fecho em `onClose`.
//
// Os dois módulos têm endpoints distintos (`/departments` vs
// `/organization/departments`) mas operam sobre a mesma tabela `department`
// e ambos os DTOs de criação (CreateDepartmentDto / CreateOrgDepartmentDto)
// foram mantidos com o mesmo conjunto de campos opcionais — o ValidationPipe
// global usa `forbidNonWhitelisted`, por isso um campo aceite só num dos dois
// DTOs faria o outro endpoint rebentar com 400 ao reutilizar este formulário.
//
// Backend: POST exige @Roles(ADMIN, RH) nos dois módulos. Código único →
// 409 (mostrado inline). A lista de pais vem de /departments/tree e a de
// unidades de /units (ambos apenas activos/accessíveis a qualquer
// autenticado).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { QueryKey } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { DepartmentNode } from './types';
import { DepartmentUserPicker } from './DepartmentUserPicker';
import { useUnits, type DirectoryUser } from './departmentFormData';

export interface CreateDepartmentModalProps {
  onClose: () => void;
  /** Endpoint de criação — difere entre os dois módulos. */
  endpoint: '/departments' | '/organization/departments';
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function CreateDepartmentModal({
  onClose,
  endpoint,
  invalidateKeys,
  defaultParentId,
}: CreateDepartmentModalProps) {
  const notify = useToast();

  const parentLocked = defaultParentId != null;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState(
    parentLocked ? String(defaultParentId) : NO_PARENT,
  );
  const [unitId, setUnitId] = useState(NO_UNIT);
  const [location, setLocation] = useState('');
  const [head, setHead] = useState<DirectoryUser | null>(null);
  const [directManager, setDirectManager] = useState<DirectoryUser | null>(null);
  const [costCenter, setCostCenter] = useState('');
  const [annualBudget, setAnnualBudget] = useState('');
  const [maxEmployees, setMaxEmployees] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [operationalStartDate, setOperationalStartDate] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [phoneExtension, setPhoneExtension] = useState('');
  const [physicalLocation, setPhysicalLocation] = useState('');
  const [objective, setObjective] = useState('');
  const [mainResponsibilities, setMainResponsibilities] = useState('');
  const [functionalArea, setFunctionalArea] = useState('');
  const [isStrategic, setIsStrategic] = useState('false');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [submitError, setSubmitError] = useState('');

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
    ...units.map((u) => ({ value: String(u.id), label: `${u.name} (${u.code})` })),
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
        setSubmitError(
          e.message || 'Erro ao criar o departamento. Tente novamente.',
        ),
    },
  );
  const loading = createDept.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
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
      status,
      ...(operationalStartDate ? { operationalStartDate } : {}),
      ...(institutionalEmail.trim() ? { institutionalEmail: institutionalEmail.trim() } : {}),
      ...(phoneExtension.trim() ? { phoneExtension: phoneExtension.trim() } : {}),
      ...(physicalLocation.trim() ? { physicalLocation: physicalLocation.trim() } : {}),
      ...(objective.trim() ? { objective: objective.trim() } : {}),
      ...(mainResponsibilities.trim()
        ? { mainResponsibilities: mainResponsibilities.trim() }
        : {}),
      ...(functionalArea.trim() ? { functionalArea: functionalArea.trim() } : {}),
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Recursos Humanos"
                maxLength={120}
              />
            </FormField>

            <FormField label="Código *" htmlFor="cd-code" hint="Único.">
              <Input
                id="cd-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: RH-001"
                maxLength={20}
              />
            </FormField>

            <FormField label="Área funcional" htmlFor="cd-functional-area">
              <Input
                id="cd-functional-area"
                value={functionalArea}
                onChange={(e) => setFunctionalArea(e.target.value)}
                placeholder="Ex.: Gestão de Pessoas"
                maxLength={120}
              />
            </FormField>

            <FormField label="Departamento estratégico" htmlFor="cd-strategic">
              <Select
                items={STRATEGIC_ITEMS}
                value={isStrategic}
                onValueChange={setIsStrategic}
                className="w-full"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Descrição" htmlFor="cd-description">
                <Textarea
                  id="cd-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional — uma ou duas frases sobre o departamento."
                  rows={2}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Objectivo do departamento" htmlFor="cd-objective">
                <Textarea
                  id="cd-objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Para que existe este departamento."
                  rows={2}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Principais responsabilidades" htmlFor="cd-responsibilities">
                <Textarea
                  id="cd-responsibilities"
                  value={mainResponsibilities}
                  onChange={(e) => setMainResponsibilities(e.target.value)}
                  placeholder="Opcional — lista ou descrição das responsabilidades-chave."
                  rows={2}
                  className="w-full"
                />
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
                onValueChange={setParentId}
                disabled={parentLocked}
                className="w-full"
              />
            </FormField>

            <FormField label="Unidade/empresa" htmlFor="cd-unit">
              <Select
                items={unitItems}
                value={unitId}
                onValueChange={setUnitId}
                className="w-full"
              />
            </FormField>

            <DepartmentUserPicker
              label="Responsável pelo departamento"
              htmlFor="cd-head"
              value={head}
              onChange={setHead}
              excludeId={directManager?.id}
            />

            <DepartmentUserPicker
              label="Gestor directo"
              htmlFor="cd-direct-manager"
              value={directManager}
              onChange={setDirectManager}
              excludeId={head?.id}
            />
          </Section>

          <Section title="Orçamento e capacidade">
            <FormField label="Centro de custo" htmlFor="cd-cost-center">
              <Input
                id="cd-cost-center"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="Ex.: CC-100"
              />
            </FormField>

            <FormField label="Orçamento anual (Kz)" htmlFor="cd-budget">
              <Input
                id="cd-budget"
                type="number"
                min={0}
                value={annualBudget}
                onChange={(e) => setAnnualBudget(e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Número máximo de colaboradores" htmlFor="cd-max-employees">
              <Input
                id="cd-max-employees"
                type="number"
                min={0}
                value={maxEmployees}
                onChange={(e) => setMaxEmployees(e.target.value)}
                placeholder="Ex.: 25"
              />
            </FormField>

            <FormField label="Estado" htmlFor="cd-status">
              <Select
                items={STATUS_ITEMS}
                value={status}
                onValueChange={setStatus}
                className="w-full"
              />
            </FormField>

            <FormField label="Data de início de funcionamento" htmlFor="cd-start-date">
              <Input
                id="cd-start-date"
                type="date"
                value={operationalStartDate}
                onChange={(e) => setOperationalStartDate(e.target.value)}
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
                onChange={(e) => setInstitutionalEmail(e.target.value)}
                placeholder="rh@empresa.com"
              />
            </FormField>

            <FormField label="Telefone/ramal" htmlFor="cd-phone">
              <Input
                id="cd-phone"
                value={phoneExtension}
                onChange={(e) => setPhoneExtension(e.target.value)}
                placeholder="Ex.: 1234"
                maxLength={30}
              />
            </FormField>

            <FormField label="Localização" htmlFor="cd-location">
              <Input
                id="cd-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex.: Sede — Luanda"
                maxLength={150}
              />
            </FormField>

            <FormField label="Localização física" htmlFor="cd-physical-location">
              <Input
                id="cd-physical-location"
                value={physicalLocation}
                onChange={(e) => setPhysicalLocation(e.target.value)}
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
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-control border border-border-strong bg-surface"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#1a4bb5"
                  className="max-w-[140px] font-mono"
                />
              </div>
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Observações" htmlFor="cd-notes">
                <Textarea
                  id="cd-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
