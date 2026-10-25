// components/competencies/ModelFormModal.tsx
// Modal de criação/edição de um modelo de competências (docs/
// módulo_competencies.md §4, Fase 2). Só ADMIN/RH — mesmo RBAC de
// @Roles(ADMIN, RH) em competencies.controller.ts (POST/PUT
// /competencies/models). Mesmo padrão de CompetencyFormModal: em modo
// edição faz GET /competencies/models/:id ao abrir.

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import {
  HIERARCHY_LEVEL_CFG,
  MODEL_OBJECTIVE_OPTIONS,
  MODEL_POSITION_FAMILY_OPTIONS,
  MODEL_TYPE_OPTIONS,
} from './constants';
import { useDepartmentOptions } from './modelFormData';
import type { CompetencyModelDetail } from './types';

export interface ModelFormModalProps {
  modelId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_ITEMS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

const HIERARCHY_ITEMS = Object.entries(HIERARCHY_LEVEL_CFG).map(
  ([value, cfg]) => ({
    value,
    label: cfg.label,
  }),
);

interface ModelFormFormValues {
  name: string;
  code: string;
  description: string;
  objective: string;
  type: string;
  departmentId: string;
  positionFamily: string;
  hierarchyLevel: string;
  status: string;
  version: string;
  effectiveDate: string;
  endDate: string;
  owner: DirectoryUser | null;
  submitError: string;
}

export function ModelFormModal({
  modelId,
  onClose,
  onSuccess,
}: ModelFormModalProps) {
  const editing = modelId != null;

  const detail = useApiQuery<CompetencyModelDetail>(
    queryKeys.competencies.modelDetail(modelId ?? 0),
    `/competencies/models/${modelId}`,
    { enabled: editing, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={
          editing
            ? 'Editar modelo de competências'
            : 'Novo modelo de competências'
        }
        description={
          editing
            ? 'Actualiza os dados do modelo. As competências incluídas geram-se no detalhe.'
            : 'Ex.: Modelo de Competências — Liderança, Vendas, RH.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {editing && (detail.isLoading || !detail.data) && !detail.error ? (
          <p className="mt-5 font-body text-sm text-ink-muted">A carregar…</p>
        ) : editing && detail.error ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar o modelo.
          </div>
        ) : (
          <ModelForm
            modelId={modelId ?? null}
            initial={detail.data ?? null}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

interface ModelFormProps {
  modelId: number | null;
  initial: CompetencyModelDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ModelForm({ modelId, initial, onClose, onSuccess }: ModelFormProps) {
  const editing = modelId != null;
  const { options: departmentOptions, loading: loadingDepartments } =
    useDepartmentOptions();

  const { values: formValues, set: setField } =
    useFormState<ModelFormFormValues>({
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      description: initial?.description ?? '',
      objective: initial?.objective ?? '',
      type: initial?.type ?? '',
      departmentId: initial?.department ? String(initial.department.id) : '',
      positionFamily: initial?.positionFamily ?? '',
      hierarchyLevel: initial?.hierarchyLevel ?? '',
      status: initial?.status ?? 'ACTIVE',
      version: String(initial?.version ?? 1),
      effectiveDate: initial?.effectiveDate
        ? initial.effectiveDate.slice(0, 10)
        : '',
      endDate: initial?.endDate ? initial.endDate.slice(0, 10) : '',
      owner: initial?.owner
        ? {
            id: initial.owner.id,
            fullName: initial.owner.fullName,
            avatarUrl: null,
          }
        : null,
      submitError: '',
    });
  const {
    name,
    code,
    description,
    objective,
    type,
    departmentId,
    positionFamily,
    hierarchyLevel,
    status,
    version,
    effectiveDate,
    endDate,
    owner,
    submitError,
  } = formValues;

  const canSubmit = name.trim().length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/competencies/models/${modelId}`, body)
        : apiClient.post('/competencies/models', body),
    {
      invalidateKeys: [queryKeys.competencies.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao guardar o modelo. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    const body: Record<string, unknown> = {
      name: name.trim(),
      code: code.trim() || null,
      description: description.trim() || null,
      objective: objective.trim() || null,
      type: type.trim() || null,
      departmentId: departmentId ? parseInt(departmentId, 10) : null,
      positionFamily: positionFamily.trim() || null,
      hierarchyLevel: hierarchyLevel || null,
      version: version ? parseInt(version, 10) : 1,
      effectiveDate: effectiveDate || null,
      endDate: endDate || null,
      ownerId: owner?.id ?? null,
    };
    if (editing) body.status = status;
    save.mutate(body);
  };

  return (
    <>
      <div className="mt-5 space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {submitError}
          </div>
        )}

        <FormField label="Nome *" htmlFor="mf-name">
          <Input
            id="mf-name"
            value={name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ex.: Modelo de Competências — Liderança"
            maxLength={120}
            className="w-full"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Código" htmlFor="mf-code">
            <Input
              id="mf-code"
              value={code}
              onChange={(e) => setField('code', e.target.value)}
              placeholder="Ex.: MOD-LID"
              maxLength={60}
              className="w-full"
            />
          </FormField>
          <FormField label="Tipo" htmlFor="mf-type">
            <Combobox
              items={MODEL_TYPE_OPTIONS}
              value={type || undefined}
              onValueChange={(v) => setField('type', v)}
              placeholder="Selecionar tipo"
              searchPlaceholder="Escreva para filtrar ou indicar outro…"
              allowCustom
            />
          </FormField>
        </div>

        <FormField label="Descrição" htmlFor="mf-description">
          <Textarea
            id="mf-description"
            value={description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
            className="w-full"
          />
        </FormField>

        <FormField label="Objetivo" htmlFor="mf-objective">
          <Combobox
            items={MODEL_OBJECTIVE_OPTIONS}
            value={objective || undefined}
            onValueChange={(v) => setField('objective', v)}
            placeholder="Selecionar objetivo"
            searchPlaceholder="Escreva para filtrar ou indicar outro…"
            allowCustom
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Departamento" htmlFor="mf-department">
            <Select
              items={[{ value: '', label: 'Nenhum' }, ...departmentOptions]}
              value={departmentId || undefined}
              onValueChange={(v) => setField('departmentId', v)}
              placeholder={loadingDepartments ? 'A carregar…' : 'Selecionar'}
              disabled={loadingDepartments}
              className="w-full"
            />
          </FormField>
          <FormField label="Nível hierárquico" htmlFor="mf-hierarchy">
            <Select
              items={[{ value: '', label: 'Nenhum' }, ...HIERARCHY_ITEMS]}
              value={hierarchyLevel || undefined}
              onValueChange={(v) => setField('hierarchyLevel', v)}
              placeholder="Selecionar"
              className="w-full"
            />
          </FormField>
        </div>

        <FormField label="Cargo/família profissional" htmlFor="mf-family">
          <Combobox
            items={MODEL_POSITION_FAMILY_OPTIONS}
            value={positionFamily || undefined}
            onValueChange={(v) => setField('positionFamily', v)}
            placeholder="Selecionar cargo/família"
            searchPlaceholder="Escreva para filtrar ou indicar outro…"
            allowCustom
          />
        </FormField>

        <DepartmentUserPicker
          label="Responsável pelo modelo"
          htmlFor="mf-owner"
          value={owner}
          onChange={(v) => setField('owner', v)}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Versão" htmlFor="mf-version">
            <Input
              id="mf-version"
              type="number"
              min={1}
              value={version}
              onChange={(e) => setField('version', e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Vigência (início)" htmlFor="mf-effective">
            <Input
              id="mf-effective"
              type="date"
              value={effectiveDate}
              onChange={(e) => setField('effectiveDate', e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Vigência (fim)" htmlFor="mf-end">
            <Input
              id="mf-end"
              type="date"
              value={endDate}
              onChange={(e) => setField('endDate', e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        {editing && (
          <FormField label="Estado" htmlFor="mf-status">
            <Select
              items={STATUS_ITEMS}
              value={status}
              onValueChange={(v) => setField('status', v)}
              className="w-full"
            />
          </FormField>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button intent="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
          {editing ? 'Guardar' : 'Criar'}
        </Button>
      </div>
    </>
  );
}
