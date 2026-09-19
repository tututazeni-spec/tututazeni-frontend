// components/trainings/TrainingFormModal.tsx
// Criação/edição de formação — cobre as secções Informações, Planeamento,
// Participantes (config. de aprovação) e Operação/Custos (config. de
// recursos + decomposição de custos). Documentos, comunicação, sessões e
// avaliações associadas vivem em ManageTrainingView (só fazem sentido
// depois da formação existir). Mesmo padrão de CreateCourseModal/
// EditCourseModal: `useFormValidation` + `useApiMutation`, payload enxuto
// (só envia o que foi preenchido).

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
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { CourseImageField } from '../courses/CourseImageField';
import type { Training } from './types';

export interface TrainingFormModalProps {
  /** null = criar; um Training existente = editar. */
  training: Training | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_ITEMS = [
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online (plataforma/link)' },
  { value: 'VIRTUAL_ROOM', label: 'Sala virtual' },
  { value: 'HYBRID', label: 'Híbrida' },
  { value: 'ELEARNING', label: 'E-learning' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'SEMINAR', label: 'Seminário' },
  { value: 'COACHING', label: 'Coaching' },
  { value: 'MENTORING', label: 'Mentoria' },
];

const LEVEL_ITEMS = [
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

const PRIORITY_ITEMS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

interface UserOption {
  id: number;
  fullName: string;
}
interface CompetencyOption {
  id: number;
  name: string;
}
interface CourseOption {
  id: number;
  title: string;
}
interface OrgOption {
  id: number;
  name: string;
}

function n(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function TrainingFormModal({ training, onClose, onSuccess }: TrainingFormModalProps) {
  const editing = !!training;

  const { data: usersResp } = useApiQuery<{ data: UserOption[] }>(
    ['trainings', 'users-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: competenciesResp } = useApiQuery<{ data: CompetencyOption[] }>(
    ['trainings', 'competencies-picker'],
    '/competencies',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: coursesResp } = useApiQuery<{ data: CourseOption[] }>(
    ['trainings', 'courses-picker'],
    '/courses',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: departmentsResp } = useApiQuery<{ data: OrgOption[] }>(
    ['trainings', 'departments-picker'],
    '/departments',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: unitsResp } = useApiQuery<OrgOption[]>(
    ['trainings', 'units-picker'],
    '/units',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: positionsResp } = useApiQuery<OrgOption[]>(
    ['trainings', 'positions-picker'],
    '/positions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const userItems = (usersResp?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.fullName,
  }));
  const courseItems = (coursesResp?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
  const competencyOptions = competenciesResp?.data ?? [];
  const departmentOptions = departmentsResp?.data ?? [];
  const unitOptions = Array.isArray(unitsResp) ? unitsResp : [];
  const positionOptions = Array.isArray(positionsResp) ? positionsResp : [];

  const [coInstructorIds, setCoInstructorIds] = useState<number[]>(
    training?.coInstructors?.map((c) => c.user.id) ?? [],
  );
  const [competencyIds, setCompetencyIds] = useState<number[]>(
    training?.competencies?.map((c) => c.competency.id) ?? [],
  );
  const [targetDeptIds, setTargetDeptIds] = useState<number[]>(training?.targetDeptIds ?? []);
  const [targetUnitIds, setTargetUnitIds] = useState<number[]>(training?.targetUnitIds ?? []);
  const [targetPositionIds, setTargetPositionIds] = useState<number[]>(
    training?.targetPositionIds ?? [],
  );

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: training?.title ?? '',
      code: training?.code ?? '',
      shortDescription: training?.shortDescription ?? '',
      description: training?.description ?? '',
      objectives: training?.objectives ?? '',
      targetAudience: training?.targetAudience ?? '',
      type: training?.type ?? '',
      level: training?.level ?? '',
      category: training?.category ?? '',
      thematicArea: training?.thematicArea ?? '',
      tags: training?.tags?.join(', ') ?? '',
      language: training?.language ?? 'pt',
      workloadHours: training?.workloadHours?.toString() ?? '',
      thumbnailUrl: training?.thumbnailUrl ?? '',
      prerequisites: training?.prerequisites ?? '',
      instructorId: training?.instructor?.id?.toString() ?? '',
      responsibleId: training?.responsible?.id?.toString() ?? '',
      courseId: training?.courseId?.toString() ?? '',
      priority: training?.priority ?? '',
      plannedBudget: training?.plannedBudget?.toString() ?? '',
      trainingEntity: training?.trainingEntity ?? '',
      classDescription: training?.classDescription ?? '',
      modalityDetails: training?.modalityDetails ?? '',
      mandatory: training?.mandatory ?? false,
      passingScore: training?.passingScore?.toString() ?? '70',
      issueCertificate: training?.issueCertificate ?? false,
      startDate: training?.startDate?.slice(0, 10) ?? '',
      endDate: training?.endDate?.slice(0, 10) ?? '',
      completionDeadlineDays: training?.completionDeadlineDays?.toString() ?? '',
      schedule: training?.schedule ?? '',
      roomLocation: training?.roomLocation ?? '',
      capacity: training?.capacity?.toString() ?? '',
      plannedSessionsCount: training?.plannedSessionsCount?.toString() ?? '',
      requiresApproval: training?.requiresApproval ?? false,
      requiredResources: training?.requiredResources?.join(', ') ?? '',
      instructorCost: training?.instructorCost?.toString() ?? '',
      materialCost: training?.materialCost?.toString() ?? '',
      transportCost: training?.transportCost?.toString() ?? '',
      foodCost: training?.foodCost?.toString() ?? '',
      lodgingCost: training?.lodgingCost?.toString() ?? '',
      otherCosts: training?.otherCosts?.toString() ?? '',
    },
    { title: [required()], type: [required()], level: [required()] },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      type: form.type,
      level: form.level,
    };
    const str = (key: keyof typeof form, target = key as string) => {
      const v = (form[key] as string).trim();
      if (v) payload[target] = v;
    };
    str('code');
    str('shortDescription');
    str('description');
    str('objectives');
    str('targetAudience');
    str('category');
    str('thematicArea');
    str('language');
    str('thumbnailUrl');
    str('prerequisites');
    str('trainingEntity');
    str('classDescription');
    str('modalityDetails');
    str('schedule');
    str('roomLocation');

    if (form.tags.trim()) {
      payload.tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (form.requiredResources.trim()) {
      payload.requiredResources = form.requiredResources
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (form.instructorId) payload.instructorId = n(form.instructorId);
    if (form.responsibleId) payload.responsibleId = n(form.responsibleId);
    if (form.courseId) payload.courseId = n(form.courseId);
    if (form.plannedBudget) payload.plannedBudget = n(form.plannedBudget);
    payload.priority = form.priority || 'MEDIUM';
    payload.targetDeptIds = targetDeptIds;
    payload.targetUnitIds = targetUnitIds;
    payload.targetPositionIds = targetPositionIds;
    if (form.workloadHours) payload.workloadHours = n(form.workloadHours);
    if (form.passingScore) payload.passingScore = n(form.passingScore);
    if (form.completionDeadlineDays) {
      payload.completionDeadlineDays = n(form.completionDeadlineDays);
    }
    if (form.capacity) payload.capacity = n(form.capacity);
    if (form.plannedSessionsCount) {
      payload.plannedSessionsCount = n(form.plannedSessionsCount);
    }
    if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
    if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();
    payload.mandatory = form.mandatory;
    payload.issueCertificate = form.issueCertificate;
    payload.requiresApproval = form.requiresApproval;

    (
      ['instructorCost', 'materialCost', 'transportCost', 'foodCost', 'lodgingCost', 'otherCosts'] as const
    ).forEach((key) => {
      if (form[key]) payload[key] = n(form[key]);
    });

    payload.coInstructorIds = coInstructorIds;
    payload.competencyIds = competencyIds;

    return payload;
  }

  const mutation = useApiMutation(
    () => {
      const payload = buildPayload();
      return editing
        ? apiClient.put(`/trainings/${training!.id}`, payload)
        : apiClient.post('/trainings', payload);
    },
    {
      invalidateKeys: [queryKeys.trainings.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError(
          editing ? 'Erro ao actualizar formação.' : 'Erro ao criar formação. Verifique os dados.',
        ),
    },
  );
  const loading = mutation.isPending;
  const handleSubmit = withValidation(() => {
    setSubmitError('');
    mutation.mutate(undefined);
  });

  function toggle(list: number[], setList: (v: number[]) => void, id: number) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? `Editar "${training!.title}"` : 'Nova Formação'}
        description={
          editing
            ? undefined
            : 'A formação é criada como rascunho — publica-a depois na Gestão.'
        }
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <Tabs defaultValue="info">
            <TabsList className="flex-wrap">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="planning">Planeamento</TabsTrigger>
              <TabsTrigger value="participants">Participantes</TabsTrigger>
              <TabsTrigger value="operation">Operação</TabsTrigger>
              <TabsTrigger value="costs">Custos</TabsTrigger>
            </TabsList>

            {/* ── Informações ─────────────────────────────────────────── */}
            <TabsContent value="info" className="space-y-4">
              <FormField label="Nome da formação *" htmlFor="tf-title">
                <Input
                  id="tf-title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Liderança e Gestão de Equipas"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Código da formação" htmlFor="tf-code">
                  <Input
                    id="tf-code"
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value)}
                    className="w-full"
                    placeholder="Ex: FORM-2026-001"
                  />
                </FormField>
                <FormField label="Categoria" htmlFor="tf-category">
                  <Input
                    id="tf-category"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <FormField label="Descrição curta" htmlFor="tf-shortDescription">
                <Input
                  id="tf-shortDescription"
                  value={form.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  className="w-full"
                />
              </FormField>

              <FormField label="Descrição" htmlFor="tf-description">
                <Textarea
                  id="tf-description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </FormField>

              <FormField label="Objetivo da formação" htmlFor="tf-objectives">
                <Textarea
                  id="tf-objectives"
                  value={form.objectives}
                  onChange={(e) => setField('objectives', e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Área temática" htmlFor="tf-thematicArea">
                  <Input
                    id="tf-thematicArea"
                    value={form.thematicArea}
                    onChange={(e) => setField('thematicArea', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Etiquetas (separadas por vírgula)" htmlFor="tf-tags">
                  <Input
                    id="tf-tags"
                    value={form.tags}
                    onChange={(e) => setField('tags', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <FormField label="Competências desenvolvidas" htmlFor="tf-competencies">
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                  {competencyOptions.length === 0 && (
                    <p className="text-xs text-ink-faint">Sem competências cadastradas.</p>
                  )}
                  {competencyOptions.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-ink-muted">
                      <input
                        type="checkbox"
                        checked={competencyIds.includes(c.id)}
                        onChange={() => toggle(competencyIds, setCompetencyIds, c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tipo de formação / Modalidade *" htmlFor="tf-type">
                  <Select
                    items={TYPE_ITEMS}
                    value={form.type || undefined}
                    onValueChange={(v) => setField('type', v)}
                    className="w-full"
                    placeholder="Selecionar"
                  />
                </FormField>
                <FormField label="Nível *" htmlFor="tf-level">
                  <Select
                    items={LEVEL_ITEMS}
                    value={form.level || undefined}
                    onValueChange={(v) => setField('level', v)}
                    className="w-full"
                    placeholder="Selecionar"
                  />
                </FormField>
              </div>

              <FormField
                label="Detalhes da modalidade (plataforma/link, sala virtual ou instruções de acesso)"
                htmlFor="tf-modalityDetails"
              >
                <Textarea
                  id="tf-modalityDetails"
                  value={form.modalityDetails}
                  onChange={(e) => setField('modalityDetails', e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>

              <FormField label="Descrição específica desta turma" htmlFor="tf-classDescription">
                <Textarea
                  id="tf-classDescription"
                  value={form.classDescription}
                  onChange={(e) => setField('classDescription', e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Formador/Instrutor" htmlFor="tf-instructor">
                  <Combobox
                    items={userItems}
                    value={form.instructorId || undefined}
                    onValueChange={(v) => setField('instructorId', v)}
                    placeholder="Selecionar instrutor"
                    className="w-full"
                  />
                </FormField>
                <FormField label="Entidade formadora" htmlFor="tf-trainingEntity">
                  <Input
                    id="tf-trainingEntity"
                    value={form.trainingEntity}
                    onChange={(e) => setField('trainingEntity', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Responsável" htmlFor="tf-responsible">
                  <Combobox
                    items={userItems}
                    value={form.responsibleId || undefined}
                    onValueChange={(v) => setField('responsibleId', v)}
                    placeholder="Selecionar responsável"
                    className="w-full"
                  />
                </FormField>
                <FormField label="Curso associado" htmlFor="tf-course">
                  <Combobox
                    items={courseItems}
                    value={form.courseId || undefined}
                    onValueChange={(v) => setField('courseId', v)}
                    placeholder="Selecionar curso"
                    className="w-full"
                  />
                </FormField>
                <FormField label="Prioridade" htmlFor="tf-priority">
                  <Select
                    items={PRIORITY_ITEMS}
                    value={form.priority || undefined}
                    onValueChange={(v) => setField('priority', v)}
                    className="w-full"
                    placeholder="Selecionar"
                  />
                </FormField>
              </div>

              <FormField label="Instrutores adicionais" htmlFor="tf-coInstructors">
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                  {userItems.length === 0 && (
                    <p className="text-xs text-ink-faint">Sem utilizadores.</p>
                  )}
                  {userItems.map((u) => (
                    <label key={u.value} className="flex items-center gap-2 text-xs text-ink-muted">
                      <input
                        type="checkbox"
                        checked={coInstructorIds.includes(Number(u.value))}
                        onChange={() => toggle(coInstructorIds, setCoInstructorIds, Number(u.value))}
                      />
                      {u.label}
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Idioma" htmlFor="tf-language">
                  <Input
                    id="tf-language"
                    value={form.language}
                    onChange={(e) => setField('language', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Carga horária (h)" htmlFor="tf-workloadHours">
                  <Input
                    id="tf-workloadHours"
                    type="number"
                    min={0}
                    value={form.workloadHours}
                    onChange={(e) => setField('workloadHours', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <FormField label="Imagem/capa" htmlFor="tf-thumbnail">
                <CourseImageField
                  value={form.thumbnailUrl || null}
                  onChange={(v) => setField('thumbnailUrl', v ?? '')}
                />
              </FormField>
            </TabsContent>

            {/* ── Planeamento ──────────────────────────────────────────── */}
            <TabsContent value="planning" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Data de início" htmlFor="tf-startDate">
                  <Input
                    id="tf-startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setField('startDate', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Data de fim" htmlFor="tf-endDate">
                  <Input
                    id="tf-endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField('endDate', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <FormField label="Horário" htmlFor="tf-schedule">
                <Input
                  id="tf-schedule"
                  value={form.schedule}
                  onChange={(e) => setField('schedule', e.target.value)}
                  className="w-full"
                  placeholder="Ex: 09h00–13h00, Seg. a Qui."
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Local/sala" htmlFor="tf-roomLocation">
                  <Input
                    id="tf-roomLocation"
                    value={form.roomLocation}
                    onChange={(e) => setField('roomLocation', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Capacidade" htmlFor="tf-capacity">
                  <Input
                    id="tf-capacity"
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={(e) => setField('capacity', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nº de sessões planeadas" htmlFor="tf-plannedSessionsCount">
                  <Input
                    id="tf-plannedSessionsCount"
                    type="number"
                    min={0}
                    value={form.plannedSessionsCount}
                    onChange={(e) => setField('plannedSessionsCount', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Prazo de conclusão (dias)" htmlFor="tf-completionDeadlineDays">
                  <Input
                    id="tf-completionDeadlineDays"
                    type="number"
                    min={1}
                    value={form.completionDeadlineDays}
                    onChange={(e) => setField('completionDeadlineDays', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>

              <FormField label="Pré-requisitos" htmlFor="tf-prerequisites">
                <Textarea
                  id="tf-prerequisites"
                  value={form.prerequisites}
                  onChange={(e) => setField('prerequisites', e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>

              <FormField label="Público-alvo" htmlFor="tf-targetAudience">
                <Textarea
                  id="tf-targetAudience"
                  value={form.targetAudience}
                  onChange={(e) => setField('targetAudience', e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>

              <FormField label="Orçamento previsto (Kz)" htmlFor="tf-plannedBudget">
                <Input
                  id="tf-plannedBudget"
                  type="number"
                  min={0}
                  value={form.plannedBudget}
                  onChange={(e) => setField('plannedBudget', e.target.value)}
                  className="w-full max-w-[220px]"
                />
              </FormField>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Unidades abrangidas" htmlFor="tf-units">
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                    {unitOptions.length === 0 && (
                      <p className="text-xs text-ink-faint">Sem unidades.</p>
                    )}
                    {unitOptions.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 text-xs text-ink-muted">
                        <input
                          type="checkbox"
                          checked={targetUnitIds.includes(u.id)}
                          onChange={() => toggle(targetUnitIds, setTargetUnitIds, u.id)}
                        />
                        {u.name}
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="Departamentos abrangidos" htmlFor="tf-departments">
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                    {departmentOptions.length === 0 && (
                      <p className="text-xs text-ink-faint">Sem departamentos.</p>
                    )}
                    {departmentOptions.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-xs text-ink-muted">
                        <input
                          type="checkbox"
                          checked={targetDeptIds.includes(d.id)}
                          onChange={() => toggle(targetDeptIds, setTargetDeptIds, d.id)}
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="Cargos abrangidos" htmlFor="tf-positions">
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                    {positionOptions.length === 0 && (
                      <p className="text-xs text-ink-faint">Sem cargos.</p>
                    )}
                    {positionOptions.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-ink-muted">
                        <input
                          type="checkbox"
                          checked={targetPositionIds.includes(p.id)}
                          onChange={() => toggle(targetPositionIds, setTargetPositionIds, p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            </TabsContent>

            {/* ── Participantes ────────────────────────────────────────── */}
            <TabsContent value="participants" className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.requiresApproval}
                  onChange={(e) => setField('requiresApproval', e.target.checked)}
                />
                Inscrições precisam de aprovação
              </label>
              <p className="text-xs text-ink-faint">
                Se activado, cada inscrição fica pendente até seres aprovada/rejeitada por
                quem gere a formação (separador &quot;Participantes&quot; da Gestão).
              </p>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.mandatory}
                  onChange={(e) => setField('mandatory', e.target.checked)}
                />
                Formação obrigatória
              </label>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.issueCertificate}
                  onChange={(e) => setField('issueCertificate', e.target.checked)}
                />
                Emitir certificado na conclusão
              </label>

              {form.issueCertificate && (
                <FormField label="Nota mínima para certificado (0-100)" htmlFor="tf-passingScore">
                  <Input
                    id="tf-passingScore"
                    type="number"
                    min={0}
                    max={100}
                    value={form.passingScore}
                    onChange={(e) => setField('passingScore', e.target.value)}
                    className="w-full max-w-[160px]"
                  />
                </FormField>
              )}
            </TabsContent>

            {/* ── Operação ─────────────────────────────────────────────── */}
            <TabsContent value="operation" className="space-y-4">
              <FormField
                label="Recursos necessários (separados por vírgula)"
                htmlFor="tf-requiredResources"
              >
                <Input
                  id="tf-requiredResources"
                  value={form.requiredResources}
                  onChange={(e) => setField('requiredResources', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Projector, Portáteis, Flipchart"
                />
              </FormField>
              <p className="text-xs text-ink-faint">
                Documentos administrativos, comunicação/notificações e sessões geram-se
                depois de criares a formação, na Gestão.
              </p>
            </TabsContent>

            {/* ── Custos ───────────────────────────────────────────────── */}
            <TabsContent value="costs" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Custo do formador (Kz)" htmlFor="tf-instructorCost">
                  <Input
                    id="tf-instructorCost"
                    type="number"
                    min={0}
                    value={form.instructorCost}
                    onChange={(e) => setField('instructorCost', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Material (Kz)" htmlFor="tf-materialCost">
                  <Input
                    id="tf-materialCost"
                    type="number"
                    min={0}
                    value={form.materialCost}
                    onChange={(e) => setField('materialCost', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Transporte (Kz)" htmlFor="tf-transportCost">
                  <Input
                    id="tf-transportCost"
                    type="number"
                    min={0}
                    value={form.transportCost}
                    onChange={(e) => setField('transportCost', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Alimentação (Kz)" htmlFor="tf-foodCost">
                  <Input
                    id="tf-foodCost"
                    type="number"
                    min={0}
                    value={form.foodCost}
                    onChange={(e) => setField('foodCost', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Alojamento (Kz)" htmlFor="tf-lodgingCost">
                  <Input
                    id="tf-lodgingCost"
                    type="number"
                    min={0}
                    value={form.lodgingCost}
                    onChange={(e) => setField('lodgingCost', e.target.value)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Outros custos (Kz)" htmlFor="tf-otherCosts">
                  <Input
                    id="tf-otherCosts"
                    type="number"
                    min={0}
                    value={form.otherCosts}
                    onChange={(e) => setField('otherCosts', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
              <p className="text-xs text-ink-faint">
                O custo total é calculado automaticamente (soma dos valores acima) e mostrado
                na Gestão, junto com o custo por participante.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'A guardar...' : editing ? 'Guardar alterações' : 'Criar Formação'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
