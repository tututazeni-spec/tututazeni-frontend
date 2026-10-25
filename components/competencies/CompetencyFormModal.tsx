// components/competencies/CompetencyFormModal.tsx
// Modal único de criação e edição de competências, aberto a partir do
// cabeçalho ("+ Nova competência") e do CompetencyDetailModal ("Editar").
// Só ADMIN/RH — o mesmo RBAC de @Roles(ADMIN, RH) em competencies.controller.ts
// (POST /competencies e PUT /competencies/:id). Segue o padrão de
// components/courses/EditCourseModal: em modo edição faz GET /competencies/:id
// ao abrir e o formulário só monta depois de os dados chegarem, para os
// campos arrancarem já com os valores reais.
//
// DTO CreateCompetencyDto: name (obrigatório, máx 120) e category (enum
// CompetencyCategory, obrigatório); description, tags[] e status opcionais.
// PUT aceita PartialType do mesmo DTO. O backend responde 409 se o nome (ou
// o código) colidir (case-insensitive) — mostramos a mensagem tal como vem.
//
// docs/módulo_competencies.md §2 (Fase 1 — Geral + Configuração): code,
// family, objective, isCritical, isStrategic, isMandatory, isAssessable,
// isDevelopable, ownerId. Aplicabilidade/Critérios/Desenvolvimento ficam
// para fases futuras (ver docs/superpowers/specs/
// 2026-09-24-competencies-fase1-design.md).

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Combobox } from '@/components/ui/Combobox';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import { CATEGORY_CFG } from './constants';
import type { CompetencyDetail } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

/** Famílias de competências sugeridas; o Combobox também aceita outra escrita à mão. */
const FAMILY_OPTIONS = [
  'Liderança e Gestão',
  'Comunicação e Relacionamento',
  'Orientação para Resultados',
  'Inovação e Pensamento Crítico',
  'Trabalho em Equipa',
  'Atendimento ao Cliente',
  'Competências Técnicas',
  'Competências Digitais',
  'Ética e Compliance',
  'Segurança e Qualidade',
  'Gestão Financeira',
  'Desenvolvimento Pessoal',
].map((label) => ({ value: label, label }));

export interface CompetencyFormModalProps {
  /** Ausente/null → criar; número → editar essa competência. */
  competencyId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_ITEMS = Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const STATUS_ITEMS = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'INACTIVE', label: 'Arquivada' },
];

interface CompetencyFormFormValues {
  name: string;
  category: string;
  description: string;
  tagsRaw: string;
  status: string;
  code: string;
  family: string;
  objective: string;
  isCritical: boolean;
  isStrategic: boolean;
  isMandatory: boolean;
  isAssessable: boolean;
  isDevelopable: boolean;
  owner: DirectoryUser | null;
  submitError: string;
}

export function CompetencyFormModal({
  competencyId,
  onClose,
  onSuccess,
}: CompetencyFormModalProps) {
  const editing = competencyId != null;

  const detail = useApiQuery<CompetencyDetail>(
    queryKeys.competencies.detail(competencyId ?? 0),
    `/competencies/${competencyId}`,
    { enabled: editing, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Editar competência' : 'Nova competência'}
        description={
          editing
            ? 'Actualiza os dados da competência. As alterações aplicam-se de imediato.'
            : 'Cria uma competência no catálogo da organização.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {editing && (detail.isLoading || !detail.data) && !detail.error ? (
          <p className="mt-5 font-body text-sm text-ink-muted">A carregar…</p>
        ) : editing && detail.error ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar a competência.
          </div>
        ) : (
          <CompetencyForm
            competencyId={competencyId ?? null}
            initial={detail.data ?? null}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

interface CompetencyFormProps {
  competencyId: number | null;
  initial: CompetencyDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CompetencyForm({
  competencyId,
  initial,
  onClose,
  onSuccess,
}: CompetencyFormProps) {
  const editing = competencyId != null;

  const { values: formValues, set: setField } =
    useFormState<CompetencyFormFormValues>({
      name: initial?.name ?? '',
      category: initial?.category ?? '',
      description: initial?.description ?? '',
      tagsRaw: (initial?.tags ?? []).join(', '),
      status: initial?.status ?? 'ACTIVE',
      code: initial?.code ?? '',
      family: initial?.family ?? '',
      objective: initial?.objective ?? '',
      isCritical: initial?.isCritical ?? false,
      isStrategic: initial?.isStrategic ?? false,
      isMandatory: initial?.isMandatory ?? false,
      isAssessable: initial?.isAssessable ?? true,
      isDevelopable: initial?.isDevelopable ?? true,
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
    category,
    description,
    tagsRaw,
    status,
    code,
    family,
    objective,
    isCritical,
    isStrategic,
    isMandatory,
    isAssessable,
    isDevelopable,
    owner,
    submitError,
  } = formValues;
  // docs/módulo_competencies.md §2 — Informações gerais + Configuração.

  const canSubmit = name.trim().length > 0 && category.length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/competencies/${competencyId}`, body)
        : apiClient.post('/competencies', body),
    {
      invalidateKeys: [queryKeys.competencies.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao guardar a competência. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const body: Record<string, unknown> = {
      name: name.trim(),
      category,
      description: description.trim() || null,
      tags,
      code: code.trim() || null,
      family: family.trim() || null,
      objective: objective.trim() || null,
      isCritical,
      isStrategic,
      isMandatory,
      isAssessable,
      isDevelopable,
      ownerId: owner?.id ?? null,
    };
    // status só é editável para competências já existentes (criar → ACTIVE
    // por defeito no backend).
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

        <FormField label="Nome *" htmlFor="cf-name">
          <Input
            id="cf-name"
            value={name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ex.: Comunicação Eficaz"
            maxLength={120}
            className="w-full"
          />
        </FormField>

        <FormField label="Categoria *" htmlFor="cf-category">
          <Select
            items={CATEGORY_ITEMS}
            value={category || undefined}
            onValueChange={(v) => setField('category', v)}
            placeholder="Selecionar categoria"
            className="w-full"
          />
        </FormField>

        <FormField label="Descrição" htmlFor="cf-description">
          <Textarea
            id="cf-description"
            value={description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            placeholder="Opcional — o que esta competência representa."
            className="w-full"
          />
        </FormField>

        <FormField label="Tags" htmlFor="cf-tags" hint="Separadas por vírgula.">
          <Input
            id="cf-tags"
            value={tagsRaw}
            onChange={(e) => setField('tagsRaw', e.target.value)}
            placeholder="liderança, feedback, comunicação"
            className="w-full"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Código" htmlFor="cf-code">
            <Input
              id="cf-code"
              value={code}
              onChange={(e) => setField('code', e.target.value)}
              placeholder="Ex.: COMP-014"
              maxLength={60}
              className="w-full"
            />
          </FormField>
          <FormField label="Família" htmlFor="cf-family">
            <Combobox
              items={FAMILY_OPTIONS}
              value={family || undefined}
              onValueChange={(v) => setField('family', v)}
              placeholder="Selecionar família"
              searchPlaceholder="Escreva para filtrar ou indicar outra…"
              allowCustom
            />
          </FormField>
        </div>

        <FormField label="Objetivo" htmlFor="cf-objective">
          <Textarea
            id="cf-objective"
            value={objective}
            onChange={(e) => setField('objective', e.target.value)}
            rows={2}
            placeholder="Opcional — o que se pretende alcançar com esta competência."
            className="w-full"
          />
        </FormField>

        <DepartmentUserPicker
          label="Responsável pela competência"
          htmlFor="cf-owner"
          value={owner}
          onChange={(v) => setField('owner', v)}
        />

        <div className="grid grid-cols-2 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={isCritical}
              onChange={(e) => setField('isCritical', e.target.checked)}
            />
            Competência crítica
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={isStrategic}
              onChange={(e) => setField('isStrategic', e.target.checked)}
            />
            Competência estratégica
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={isMandatory}
              onChange={(e) => setField('isMandatory', e.target.checked)}
            />
            Obrigatória
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={isAssessable}
              onChange={(e) => setField('isAssessable', e.target.checked)}
            />
            Avaliável
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <Checkbox
              checked={isDevelopable}
              onChange={(e) => setField('isDevelopable', e.target.checked)}
            />
            Desenvolvível
          </label>
        </div>

        {editing && (
          <FormField label="Estado" htmlFor="cf-status">
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
