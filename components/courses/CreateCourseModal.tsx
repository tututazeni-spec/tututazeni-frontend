// components/courses/CreateCourseModal.tsx
// Modal de criação de curso — validação (useFormValidation) + mutação
// (useApiMutation). Segue o padrão de components/employees/CreateEmployeeModal:
// o page.tsx só monta este componente quando `showCreate` é true, por isso o
// Modal fica sempre `open`; onOpenChange chama onClose (cobre o X, o clique
// fora e o Escape).
//
// O backend (POST /courses, courses.controller.ts) cria sempre o curso em
// estado DRAFT. A aba "Catálogo" (CatalogView) filtra status=PUBLISHED, por
// isso o curso recém-criado aparece só na aba "Dashboard" até ser publicado
// nos ecrãs de gestão existentes — daí o texto da descrição e do toast.
//
// Campos alinhados com a secção "1. Ao criar um novo Curso" de
// docs/06-modulo-courses.md (Informações gerais / Configuração académica /
// Organização).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
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
import type { PaginatedCourses } from './types';

export interface CreateCourseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Espelha os enums CourseLevel/CourseVisibility do Prisma (schema.prisma)
// com rótulos PT-PT.
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

export function CreateCourseModal({
  onClose,
  onSuccess,
}: CreateCourseModalProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: '',
      shortDescription: '',
      description: '',
      category: '',
      knowledgeArea: '',
      internalCode: '',
      level: '',
      type: '',
      modality: '',
      language: 'pt',
      visibility: 'PUBLIC',
      workloadHours: '',
      estimatedDurationDays: '',
      startDate: '',
      endDate: '',
      thumbnailUrl: '',
      tags: '',
      targetAudience: '',
      unit: '',
      departmentId: NO_DEPT,
      passingScore: '',
      minCompletionPercent: '',
      certificateEnabled: false,
      certificateCriteria: '',
      certificateValidityDays: '',
      mandatory: false,
      requiresApproval: false,
      requiredCourseId: NO_PREREQUISITE,
    },
    {
      title: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const [instructor, setInstructor] = useState<DirectoryUser | null>(null);
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
    ...(existingCourses?.data ?? []).map((c) => ({ value: String(c.id), label: c.title })),
  ];

  const createCourse = useApiMutation(
    () => {
      const payload: Record<string, unknown> = { title: form.title.trim() };
      const str = (v: string) => v.trim() || undefined;
      if (str(form.shortDescription)) payload.shortDescription = form.shortDescription.trim();
      if (str(form.description)) payload.description = form.description.trim();
      if (str(form.category)) payload.category = form.category.trim();
      if (str(form.knowledgeArea)) payload.knowledgeArea = form.knowledgeArea.trim();
      if (str(form.internalCode)) payload.internalCode = form.internalCode.trim();
      if (form.level) payload.level = form.level;
      if (form.type) payload.type = form.type;
      if (form.modality) payload.modality = form.modality;
      payload.language = form.language || 'pt';
      payload.visibility = form.visibility;
      payload.mandatory = form.mandatory;
      payload.requiresApproval = form.requiresApproval;
      payload.certificateEnabled = form.certificateEnabled;

      const hours = Number(form.workloadHours);
      if (form.workloadHours !== '' && Number.isFinite(hours) && hours >= 0) {
        payload.workloadHours = Math.trunc(hours);
      }
      const durationDays = Number(form.estimatedDurationDays);
      if (form.estimatedDurationDays !== '' && Number.isFinite(durationDays)) {
        payload.estimatedDurationDays = Math.trunc(durationDays);
      }
      const passing = Number(form.passingScore);
      if (form.passingScore !== '' && Number.isFinite(passing)) {
        payload.passingScore = Math.trunc(passing);
      }
      const minCompletion = Number(form.minCompletionPercent);
      if (form.minCompletionPercent !== '' && Number.isFinite(minCompletion)) {
        payload.minCompletionPercent = Math.trunc(minCompletion);
      }
      const certValidity = Number(form.certificateValidityDays);
      if (form.certificateValidityDays !== '' && Number.isFinite(certValidity)) {
        payload.certificateValidityDays = Math.trunc(certValidity);
      }
      if (str(form.certificateCriteria)) payload.certificateCriteria = form.certificateCriteria.trim();

      if (form.startDate) payload.startDate = form.startDate;
      if (form.endDate) payload.endDate = form.endDate;
      if (str(form.unit)) payload.unit = form.unit.trim();
      if (form.departmentId !== NO_DEPT) payload.departmentId = Number(form.departmentId);
      if (form.requiredCourseId !== NO_PREREQUISITE)
        payload.requiredCourseId = Number(form.requiredCourseId);
      if (instructor) payload.primaryInstructorId = instructor.id;

      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tags.length) payload.tags = tags;
      const targetAudience = form.targetAudience
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (targetAudience.length) payload.targetAudience = targetAudience;

      if (form.thumbnailUrl) payload.thumbnailUrl = form.thumbnailUrl;
      return apiClient.post('/courses', payload);
    },
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () => setSubmitError('Erro ao criar curso. Verifique os dados.'),
    },
  );
  const loading = createCourse.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    createCourse.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Curso"
        description="O curso é criado como rascunho. Publica-o depois na gestão de cursos."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          {/* Informações gerais */}
          <section className="space-y-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Informações gerais
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <FormField label="Título *" htmlFor="cc-title">
                <Input
                  id="cc-title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Introdução à Segurança da Informação"
                />
              </FormField>

              <FormField label="Descrição curta" htmlFor="cc-shortDescription">
                <Input
                  id="cc-shortDescription"
                  value={form.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  className="w-full"
                  placeholder="Uma frase que resume o curso"
                />
              </FormField>

              <FormField label="Descrição" htmlFor="cc-description">
                <Textarea
                  id="cc-description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="w-full"
                  rows={3}
                  placeholder="Objectivos, público-alvo, pré-requisitos…"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Categoria" htmlFor="cc-category">
                  <Input
                    id="cc-category"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    className="w-full"
                    placeholder="Ex: Compliance"
                  />
                </FormField>
                <FormField label="Área de conhecimento" htmlFor="cc-knowledgeArea">
                  <Input
                    id="cc-knowledgeArea"
                    value={form.knowledgeArea}
                    onChange={(e) => setField('knowledgeArea', e.target.value)}
                    className="w-full"
                    placeholder="Ex: Tecnologia"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Código do curso" htmlFor="cc-internalCode">
                  <Input
                    id="cc-internalCode"
                    value={form.internalCode}
                    onChange={(e) => setField('internalCode', e.target.value)}
                    className="w-full"
                    placeholder="Ex: SEC-101"
                  />
                </FormField>
                <FormField label="Nível" htmlFor="cc-level">
                  <Select
                    items={LEVEL_ITEMS}
                    value={form.level || undefined}
                    onValueChange={(v) => setField('level', v)}
                    className="w-full"
                    placeholder="Selecionar"
                  />
                </FormField>
                <FormField label="Idioma" htmlFor="cc-language">
                  <Input
                    id="cc-language"
                    value={form.language}
                    onChange={(e) => setField('language', e.target.value)}
                    className="w-full"
                    placeholder="pt"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tipo" htmlFor="cc-type">
                  <Select
                    items={TYPE_ITEMS}
                    value={form.type || undefined}
                    onValueChange={(v) => setField('type', v)}
                    className="w-full"
                    placeholder="Selecionar"
                  />
                </FormField>
                <FormField label="Modalidade" htmlFor="cc-modality">
                  <Select
                    items={MODALITY_ITEMS}
                    value={form.modality || undefined}
                    onValueChange={(v) => setField('modality', v)}
                    className="w-full"
                    placeholder="Selecionar"
                  />
                </FormField>
              </div>

              <FormField label="Visibilidade" htmlFor="cc-visibility">
                <Select
                  items={VISIBILITY_ITEMS}
                  value={form.visibility}
                  onValueChange={(v) => setField('visibility', v)}
                  className="w-full"
                />
              </FormField>

              <FormField label="Tags (separadas por vírgula)" htmlFor="cc-tags">
                <Input
                  id="cc-tags"
                  value={form.tags}
                  onChange={(e) => setField('tags', e.target.value)}
                  className="w-full"
                  placeholder="Ex: compliance, obrigatório, segurança"
                />
              </FormField>

              <FormField label="Imagem do curso" htmlFor="cc-thumbnail">
                <CourseImageField
                  value={form.thumbnailUrl || null}
                  onChange={(v) => setField('thumbnailUrl', v ?? '')}
                />
              </FormField>
            </div>
          </section>

          {/* Configuração académica */}
          <section className="space-y-4 border-t border-border pt-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Configuração académica
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Carga horária (h)" htmlFor="cc-workloadHours">
                <Input
                  id="cc-workloadHours"
                  type="number"
                  min={0}
                  value={form.workloadHours}
                  onChange={(e) => setField('workloadHours', e.target.value)}
                  className="w-full"
                  placeholder="Ex: 8"
                />
              </FormField>
              <FormField label="Duração estimada (dias)" htmlFor="cc-estimatedDurationDays">
                <Input
                  id="cc-estimatedDurationDays"
                  type="number"
                  min={0}
                  value={form.estimatedDurationDays}
                  onChange={(e) => setField('estimatedDurationDays', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Data de início" htmlFor="cc-startDate">
                <Input
                  id="cc-startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField('startDate', e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Data de término" htmlFor="cc-endDate">
                <Input
                  id="cc-endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nota mínima de aprovação (%)" htmlFor="cc-passingScore">
                <Input
                  id="cc-passingScore"
                  type="number"
                  min={0}
                  max={100}
                  value={form.passingScore}
                  onChange={(e) => setField('passingScore', e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="% mínima de conclusão" htmlFor="cc-minCompletionPercent">
                <Input
                  id="cc-minCompletionPercent"
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
                <FormField label="Critérios para emissão" htmlFor="cc-certificateCriteria">
                  <Input
                    id="cc-certificateCriteria"
                    value={form.certificateCriteria}
                    onChange={(e) => setField('certificateCriteria', e.target.value)}
                    className="w-full"
                    placeholder="Ex: nota final ≥ 70%"
                  />
                </FormField>
                <FormField label="Validade do certificado (dias)" htmlFor="cc-certificateValidityDays">
                  <Input
                    id="cc-certificateValidityDays"
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

          {/* Organização */}
          <section className="space-y-4 border-t border-border pt-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Organização
            </h3>

            <DepartmentUserPicker
              label="Instrutor principal"
              htmlFor="cc-instructor"
              value={instructor}
              onChange={setInstructor}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Departamento responsável" htmlFor="cc-department">
                <Select
                  items={deptItems}
                  value={form.departmentId}
                  onValueChange={(v) => setField('departmentId', v)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Unidade" htmlFor="cc-unit">
                <Input
                  id="cc-unit"
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <FormField label="Curso pré-requisito" htmlFor="cc-requiredCourse">
              <Select
                items={prerequisiteItems}
                value={form.requiredCourseId}
                onValueChange={(v) => setField('requiredCourseId', v)}
                className="w-full"
              />
            </FormField>

            <FormField label="Público-alvo (separado por vírgula)" htmlFor="cc-targetAudience">
              <Input
                id="cc-targetAudience"
                value={form.targetAudience}
                onChange={(e) => setField('targetAudience', e.target.value)}
                className="w-full"
                placeholder="Ex: Novos colaboradores, Gestores"
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
            {loading ? 'A criar...' : 'Criar Curso'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
