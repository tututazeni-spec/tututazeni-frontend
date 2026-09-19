// components/courses/EditCourseModal.tsx
// Modal de edição dos metadados de um curso. Espelha CreateCourseModal, mas
// via PUT /courses/:id. Aberto a partir da aba "Gestão" (GestaoView), só
// ADMIN/RH — o mesmo RBAC do endpoint (courses.controller.ts).
//
// A lista de Gestão só transporta os campos do catálogo, por isso o
// formulário faz GET /courses/:id ao abrir para um preenchimento fiável.
// O formulário em si (EditCourseForm) só monta depois de os dados
// chegarem, para o useFormValidation arrancar já com os valores reais.
//
// Estado (status) não é editável aqui de propósito: PUBLISHED só pode ser
// atingido via PATCH /courses/:id/publish (valida ≥1 módulo) — deixar
// escolher "Publicado" neste formulário contornaria essa validação. As
// transições de estado ficam nos botões da GestaoView (Publicar/Pausar/
// Arquivar/Repor).

'use client';

import { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import type { DepartmentNode } from '@/components/departments/types';
import { CourseImageField } from './CourseImageField';
import { Skeleton } from './shared';
import type { CourseDetailData, PaginatedCourses } from './types';

export interface EditCourseModalProps {
  courseId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const LEVEL_ITEMS = [
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

const VISIBILITY_ITEMS = [
  { value: 'PUBLIC', label: 'Público' },
  { value: 'PRIVATE', label: 'Privado' },
  { value: 'EMPLOYEES_ONLY', label: 'Apenas colaboradores' },
  { value: 'SELECTED_GROUPS', label: 'Apenas grupos seleccionados' },
];

// docs/modulo_courses.md secção 2 — "Tipos" e "Modalidade".
const TYPE_ITEMS = [
  { value: 'OBRIGATORIO', label: 'Obrigatório' },
  { value: 'OPCIONAL', label: 'Opcional' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'INTEGRACAO', label: 'Integração' },
  { value: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'COMPORTAMENTAL', label: 'Comportamental' },
  { value: 'LIDERANCA', label: 'Liderança' },
];

const MODALITY_ITEMS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'AO_VIVO', label: 'Ao vivo' },
  { value: 'AUTOAPRENDIZAGEM', label: 'Autoaprendizagem' },
];

const NO_DEPT = 'NONE';
const NO_PREREQUISITE = 'NONE';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

export function EditCourseModal({
  courseId,
  onClose,
  onSuccess,
}: EditCourseModalProps) {
  const course = useApiQuery<CourseDetailData>(
    queryKeys.courses.detail(courseId),
    `/courses/${courseId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Editar Curso"
        description="Actualiza os dados do curso. As alterações aplicam-se de imediato."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {course.isLoading || !course.data ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : course.error ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar o curso.
          </div>
        ) : (
          <EditCourseForm
            course={course.data}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

interface EditCourseFormProps {
  course: CourseDetailData;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCourseForm({ course, onClose, onSuccess }: EditCourseFormProps) {
  const toast = useToast();
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: course.title ?? '',
      shortDescription: course.shortDescription ?? '',
      description: course.description ?? '',
      category: course.category ?? '',
      knowledgeArea: course.knowledgeArea ?? '',
      internalCode: course.internalCode ?? '',
      level: String(course.level ?? ''),
      type: course.type ?? '',
      modality: course.modality ?? '',
      language: course.language ?? 'pt',
      visibility: String(course.visibility ?? 'PUBLIC'),
      workloadHours:
        course.workloadHours != null ? String(course.workloadHours) : '',
      estimatedDurationDays:
        course.estimatedDurationDays != null ? String(course.estimatedDurationDays) : '',
      startDate: course.startDate ? course.startDate.slice(0, 10) : '',
      endDate: course.endDate ? course.endDate.slice(0, 10) : '',
      thumbnailUrl: course.thumbnailUrl ?? '',
      tags: (course.tags ?? []).join(', '),
      targetAudience: (course.targetAudience ?? []).join(', '),
      unit: course.unit ?? '',
      departmentId: course.departmentId ? String(course.departmentId) : NO_DEPT,
      passingScore: course.passingScore != null ? String(course.passingScore) : '',
      minCompletionPercent:
        course.minCompletionPercent != null ? String(course.minCompletionPercent) : '',
      certificateEnabled: course.certificateEnabled ?? false,
      certificateCriteria: course.certificateCriteria ?? '',
      certificateValidityDays:
        course.certificateValidityDays != null ? String(course.certificateValidityDays) : '',
      mandatory: course.mandatory ?? false,
      requiresApproval: course.requiresApproval ?? false,
      requiredCourseId: course.requiredCourseId ? String(course.requiredCourseId) : NO_PREREQUISITE,
    },
    { title: [required()] },
  );
  const [submitError, setSubmitError] = useState('');
  const [instructor, setInstructor] = useState<DirectoryUser | null>(
    course.primaryInstructor
      ? {
          id: course.primaryInstructor.id,
          fullName: course.primaryInstructor.fullName,
          avatarUrl: course.primaryInstructor.avatarUrl,
        }
      : null,
  );
  const error = validationError || submitError;

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const deptItems = [
    { value: NO_DEPT, label: 'Sem departamento' },
    ...flattenTree(tree ?? []),
  ];

  const { data: existingCourses } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list({ limit: 100 }),
    '/courses?limit=100',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const prerequisiteItems = [
    { value: NO_PREREQUISITE, label: 'Nenhum' },
    ...(existingCourses?.data ?? [])
      .filter((c) => c.id !== course.id)
      .map((c) => ({ value: String(c.id), label: c.title })),
  ];

  const saveCourse = useApiMutation(
    () => {
      const hours = Number(form.workloadHours);
      const durationDays = Number(form.estimatedDurationDays);
      const passing = Number(form.passingScore);
      const minCompletion = Number(form.minCompletionPercent);
      const certValidity = Number(form.certificateValidityDays);
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        knowledgeArea: form.knowledgeArea.trim() || null,
        internalCode: form.internalCode.trim() || null,
        language: form.language || 'pt',
        visibility: form.visibility,
        workloadHours:
          form.workloadHours !== '' && Number.isFinite(hours) && hours >= 0
            ? Math.trunc(hours)
            : null,
        estimatedDurationDays:
          form.estimatedDurationDays !== '' && Number.isFinite(durationDays)
            ? Math.trunc(durationDays)
            : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        thumbnailUrl: form.thumbnailUrl || null,
        unit: form.unit.trim() || null,
        departmentId: form.departmentId !== NO_DEPT ? Number(form.departmentId) : null,
        passingScore:
          form.passingScore !== '' && Number.isFinite(passing) ? Math.trunc(passing) : null,
        minCompletionPercent:
          form.minCompletionPercent !== '' && Number.isFinite(minCompletion)
            ? Math.trunc(minCompletion)
            : null,
        certificateEnabled: form.certificateEnabled,
        certificateCriteria: form.certificateCriteria.trim() || null,
        certificateValidityDays:
          form.certificateValidityDays !== '' && Number.isFinite(certValidity)
            ? Math.trunc(certValidity)
            : null,
        mandatory: form.mandatory,
        requiresApproval: form.requiresApproval,
        requiredCourseId:
          form.requiredCourseId !== NO_PREREQUISITE ? Number(form.requiredCourseId) : null,
        primaryInstructorId: instructor ? instructor.id : null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        targetAudience: form.targetAudience.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (form.level) payload.level = form.level;
      payload.type = form.type || null;
      payload.modality = form.modality || null;
      return apiClient.put(`/courses/${course.id}`, payload);
    },
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError('Erro ao guardar o curso. Verifique os dados.'),
    },
  );
  const loading = saveCourse.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    saveCourse.mutate(undefined);
  });

  const addInstructor = useApiMutation(
    (userId: number) => apiClient.post(`/courses/${course.id}/instructors/${userId}`),
    {
      invalidateKeys: [queryKeys.courses.detail(course.id)],
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const removeInstructor = useApiMutation(
    (userId: number) => apiClient.delete(`/courses/${course.id}/instructors/${userId}`),
    {
      invalidateKeys: [queryKeys.courses.detail(course.id)],
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const [coInstructorPick, setCoInstructorPick] = useState<DirectoryUser | null>(null);

  return (
    <>
      <div className="mt-5 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <section className="space-y-4">
          <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
            Informações gerais
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <FormField label="Título *" htmlFor="ec-title">
              <Input
                id="ec-title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="Descrição curta" htmlFor="ec-shortDescription">
              <Input
                id="ec-shortDescription"
                value={form.shortDescription}
                onChange={(e) => setField('shortDescription', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="Descrição" htmlFor="ec-description">
              <Textarea
                id="ec-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full"
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Categoria" htmlFor="ec-category">
                <Input
                  id="ec-category"
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Área de conhecimento" htmlFor="ec-knowledgeArea">
                <Input
                  id="ec-knowledgeArea"
                  value={form.knowledgeArea}
                  onChange={(e) => setField('knowledgeArea', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Código do curso" htmlFor="ec-internalCode">
                <Input
                  id="ec-internalCode"
                  value={form.internalCode}
                  onChange={(e) => setField('internalCode', e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Nível" htmlFor="ec-level">
                <Select
                  items={LEVEL_ITEMS}
                  value={form.level || undefined}
                  onValueChange={(v) => setField('level', v)}
                  className="w-full"
                  placeholder="Selecionar nível"
                />
              </FormField>
              <FormField label="Idioma" htmlFor="ec-language">
                <Input
                  id="ec-language"
                  value={form.language}
                  onChange={(e) => setField('language', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipo" htmlFor="ec-type">
                <Select
                  items={TYPE_ITEMS}
                  value={form.type || undefined}
                  onValueChange={(v) => setField('type', v)}
                  className="w-full"
                  placeholder="Selecionar tipo"
                />
              </FormField>
              <FormField label="Modalidade" htmlFor="ec-modality">
                <Select
                  items={MODALITY_ITEMS}
                  value={form.modality || undefined}
                  onValueChange={(v) => setField('modality', v)}
                  className="w-full"
                  placeholder="Selecionar modalidade"
                />
              </FormField>
            </div>

            <FormField label="Visibilidade" htmlFor="ec-visibility">
              <Select
                items={VISIBILITY_ITEMS}
                value={form.visibility}
                onValueChange={(v) => setField('visibility', v)}
                className="w-full"
              />
            </FormField>

            <FormField label="Tags (separadas por vírgula)" htmlFor="ec-tags">
              <Input
                id="ec-tags"
                value={form.tags}
                onChange={(e) => setField('tags', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="Imagem do curso" htmlFor="ec-thumbnail">
              <CourseImageField
                value={form.thumbnailUrl || null}
                onChange={(v) => setField('thumbnailUrl', v ?? '')}
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
            Configuração académica
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Carga horária (h)" htmlFor="ec-workloadHours">
              <Input
                id="ec-workloadHours"
                type="number"
                min={0}
                value={form.workloadHours}
                onChange={(e) => setField('workloadHours', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Duração estimada (dias)" htmlFor="ec-estimatedDurationDays">
              <Input
                id="ec-estimatedDurationDays"
                type="number"
                min={0}
                value={form.estimatedDurationDays}
                onChange={(e) => setField('estimatedDurationDays', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de início" htmlFor="ec-startDate">
              <Input
                id="ec-startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de término" htmlFor="ec-endDate">
              <Input
                id="ec-endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nota mínima de aprovação (%)" htmlFor="ec-passingScore">
              <Input
                id="ec-passingScore"
                type="number"
                min={0}
                max={100}
                value={form.passingScore}
                onChange={(e) => setField('passingScore', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="% mínima de conclusão" htmlFor="ec-minCompletionPercent">
              <Input
                id="ec-minCompletionPercent"
                type="number"
                min={0}
                max={100}
                value={form.minCompletionPercent}
                onChange={(e) => setField('minCompletionPercent', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={form.mandatory}
                onChange={(e) => setField('mandatory', e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
              />
              Formação obrigatória
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setField('requiresApproval', e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
              />
              Requer aprovação para inscrição
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={form.certificateEnabled}
                onChange={(e) => setField('certificateEnabled', e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
              />
              Emite certificado
            </label>
          </div>

          {form.certificateEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Critérios para emissão" htmlFor="ec-certificateCriteria">
                <Input
                  id="ec-certificateCriteria"
                  value={form.certificateCriteria}
                  onChange={(e) => setField('certificateCriteria', e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Validade do certificado (dias)" htmlFor="ec-certificateValidityDays">
                <Input
                  id="ec-certificateValidityDays"
                  type="number"
                  min={0}
                  value={form.certificateValidityDays}
                  onChange={(e) => setField('certificateValidityDays', e.target.value)}
                  className="w-full"
                  placeholder="Sem expiração"
                />
              </FormField>
            </div>
          )}
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
            Organização
          </h3>

          <DepartmentUserPicker
            label="Instrutor principal"
            htmlFor="ec-instructor"
            value={instructor}
            onChange={setInstructor}
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Outros instrutores
            </label>
            <div className="mb-2 flex flex-col gap-1.5">
              {(course.instructors ?? []).map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface-sunken px-3 py-1.5"
                >
                  <span className="flex-1 truncate text-sm text-ink">{ci.user.fullName}</span>
                  <button
                    type="button"
                    onClick={() => removeInstructor.mutate(ci.userId)}
                    className="text-ink-faint hover:text-danger"
                    aria-label="Remover instrutor"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
              {(course.instructors ?? []).length === 0 && (
                <p className="m-0 text-xs text-ink-faint">Nenhum instrutor adicional.</p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <DepartmentUserPicker
                  label=""
                  htmlFor="ec-co-instructor"
                  value={coInstructorPick}
                  onChange={setCoInstructorPick}
                />
              </div>
              <Button
                type="button"
                intent="secondary"
                disabled={!coInstructorPick || addInstructor.isPending}
                onClick={() => {
                  if (!coInstructorPick) return;
                  addInstructor.mutate(coInstructorPick.id);
                  setCoInstructorPick(null);
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Departamento responsável" htmlFor="ec-department">
              <Select
                items={deptItems}
                value={form.departmentId}
                onValueChange={(v) => setField('departmentId', v)}
                className="w-full"
              />
            </FormField>
            <FormField label="Unidade" htmlFor="ec-unit">
              <Input
                id="ec-unit"
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Curso pré-requisito" htmlFor="ec-requiredCourse">
            <Select
              items={prerequisiteItems}
              value={form.requiredCourseId}
              onValueChange={(v) => setField('requiredCourseId', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Público-alvo (separado por vírgula)" htmlFor="ec-targetAudience">
            <Input
              id="ec-targetAudience"
              value={form.targetAudience}
              onChange={(e) => setField('targetAudience', e.target.value)}
              className="w-full"
            />
          </FormField>
        </section>
      </div>

      <div className="mt-6 flex gap-3 border-t border-border pt-4">
        <Button
          intent="secondary"
          className="flex-1 justify-center"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          className="flex-1 justify-center"
          onClick={handleSubmit}
          loading={loading}
        >
          {loading ? 'A guardar...' : 'Guardar'}
        </Button>
      </div>
    </>
  );
}
