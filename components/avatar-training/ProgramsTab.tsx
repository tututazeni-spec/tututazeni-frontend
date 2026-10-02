// components/avatar-training/ProgramsTab.tsx
// Formações com Avatar (docs/Avatar_Training.md §2/§4). «Catálogo» (todos): só
// formações publicadas, com pesquisa e categoria. «Gestão» (autoria): criação,
// envio para revisão, publicação (ADMIN/RH) e arquivo. Os papéis espelham
// @Roles em src/avatar-training/avatar-training.controller.ts.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { GraduationCap, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  ADMIN_ROLES,
  AUTHOR_ROLES,
  DIFFICULTY_LABEL,
  EXPERIENCE_LABEL,
  PROGRAM_STATUS,
} from './constants';
import type { AvatarProgram } from './types';

const ALL = 'ALL';

const DIFFICULTY_ITEMS = Object.entries(DIFFICULTY_LABEL).map(([value, label]) => ({
  value,
  label,
}));
const EXPERIENCE_ITEMS = Object.entries(EXPERIENCE_LABEL).map(([value, label]) => ({
  value,
  label,
}));
const LANGUAGE_ITEMS = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
];

function CheckList({
  legend,
  options,
  selected,
  onChange,
  emptyText,
}: {
  legend: string;
  options: { id: number; label: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
  emptyText: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1 font-body text-sm font-medium text-ink">
        {legend}
      </legend>
      <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border bg-surface p-2">
        {options.length === 0 ? (
          <p className="font-body text-xs text-ink-faint">{emptyText}</p>
        ) : (
          options.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 font-body text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((x) => x !== o.id),
                  )
                }
              />
              {o.label}
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}

const lines = (v: string) =>
  v
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

function CreateProgramModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const notify = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [experienceType, setExperienceType] = useState('GUIDED_LESSON');
  const [language, setLanguage] = useState('pt');
  const [duration, setDuration] = useState('');
  const [courseId, setCourseId] = useState(ALL);
  const [prerequisites, setPrerequisites] = useState<number[]>([]);
  const [departments, setDepartments] = useState<number[]>([]);
  const [roleNames, setRoleNames] = useState('');
  const [competencies, setCompetencies] = useState<number[]>([]);
  const [certificate, setCertificate] = useState(false);

  const courseParams = { limit: 100 };
  const courses = useApiQuery<{ data: { id: number; title: string }[] }>(
    queryKeys.courses.list(courseParams),
    '/courses',
    { params: courseParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const deptParams = { limit: 200 };
  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    { params: deptParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const comps = useApiQuery<{ data: { id: number; name: string }[] }>(
    ['avatar-training', 'competency-options'],
    '/competencies',
    { params: { limit: 100 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const courseOptions = (courses.data?.data ?? []).map((c) => ({
    id: c.id,
    label: c.title,
  }));

  const create = useApiMutation(
    () =>
      apiClient.post('/avatar-training/programs', {
        title: title.trim(),
        description: description.trim() || undefined,
        objectives: lines(objectives),
        category: category.trim() || undefined,
        difficulty,
        experienceType,
        language,
        durationMinutes: duration ? Number(duration) : undefined,
        courseId: courseId === ALL ? undefined : Number(courseId),
        prerequisiteCourseIds: prerequisites,
        targetDepartmentIds: departments,
        targetRoleNames: roleNames
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        competencyIds: competencies,
        certificateEnabled: certificate,
      }),
    {
      onSuccess: () => {
        notify({ title: 'Formação criada', intent: 'success' });
        onCreated();
        onClose();
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível criar a formação',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const durationInvalid =
    duration !== '' &&
    (!Number.isInteger(Number(duration)) ||
      Number(duration) < 1 ||
      Number(duration) > 1440);

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Nova formação com avatar"
        description="Fica em rascunho até ser revista e publicada."
      >
        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <FormField label="Título" htmlFor="ap-title">
            <Input
              id="ap-title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>
          <FormField label="Descrição" htmlFor="ap-desc">
            <Textarea
              id="ap-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <FormField
            label="Objectivos de aprendizagem"
            htmlFor="ap-obj"
            hint="Um por linha."
          >
            <Textarea
              id="ap-obj"
              rows={3}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Categoria" htmlFor="ap-cat">
              <Input
                id="ap-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </FormField>
            <FormField label="Nível de dificuldade" htmlFor="ap-diff">
              <Select
                value={difficulty}
                onValueChange={setDifficulty}
                items={DIFFICULTY_ITEMS}
              />
            </FormField>
            <FormField label="Tipo de experiência" htmlFor="ap-exp">
              <Select
                value={experienceType}
                onValueChange={setExperienceType}
                items={EXPERIENCE_ITEMS}
              />
            </FormField>
            <FormField label="Idioma" htmlFor="ap-lang">
              <Select
                value={language}
                onValueChange={setLanguage}
                items={LANGUAGE_ITEMS}
              />
            </FormField>
            <FormField
              label="Duração estimada (min)"
              htmlFor="ap-dur"
              error={durationInvalid ? 'Entre 1 e 1440 minutos' : undefined}
            >
              <Input
                id="ap-dur"
                type="number"
                min={1}
                max={1440}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </FormField>
            <FormField label="Curso associado" htmlFor="ap-course">
              <Combobox
                value={courseId}
                onValueChange={setCourseId}
                placeholder="Sem curso"
                items={[
                  { value: ALL, label: 'Sem curso' },
                  ...courseOptions.map((c) => ({
                    value: String(c.id),
                    label: c.label,
                  })),
                ]}
              />
            </FormField>
          </div>
          <CheckList
            legend="Pré-requisitos (cursos concluídos)"
            options={courseOptions}
            selected={prerequisites}
            onChange={setPrerequisites}
            emptyText="Sem cursos disponíveis."
          />
          <CheckList
            legend="Público-alvo — departamentos"
            options={(depts.data?.data ?? []).map((d) => ({
              id: d.id,
              label: d.name,
            }))}
            selected={departments}
            onChange={setDepartments}
            emptyText="Sem departamentos disponíveis."
          />
          <FormField
            label="Público-alvo — cargos"
            htmlFor="ap-roles"
            hint="Separados por vírgula. Vazio = todos."
          >
            <Input
              id="ap-roles"
              value={roleNames}
              onChange={(e) => setRoleNames(e.target.value)}
            />
          </FormField>
          <CheckList
            legend="Competências-alvo"
            options={(comps.data?.data ?? []).map((c) => ({
              id: c.id,
              label: c.name,
            }))}
            selected={competencies}
            onChange={setCompetencies}
            emptyText="Sem competências disponíveis."
          />
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={certificate}
              onChange={(e) => setCertificate(e.target.checked)}
            />
            Permitir pedido de certificado ao concluir
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button intent="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={create.isPending}
            disabled={!title.trim() || durationInvalid}
            onClick={() => create.mutate(undefined)}
          >
            Criar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function ProgramsTab() {
  const role = useCurrentRole();
  const notify = useToast();
  const isAuthor = !!role && AUTHOR_ROLES.includes(role);
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState<'catalog' | 'manage'>('catalog');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState(ALL);
  const manage = isAuthor && mode === 'manage';

  const params: Record<string, string> = {};
  if (search.trim()) params.search = search.trim();
  if (category.trim()) params.category = category.trim();
  // Catálogo mostra só o publicado, mesmo para quem tem acesso a rascunhos.
  if (!manage) params.status = 'PUBLISHED';
  else if (status !== ALL) params.status = status;
  const key = queryKeys.avatarTraining.programs(params);
  const { data, isLoading, error, refetch } = useApiQuery<AvatarProgram[]>(
    key,
    '/avatar-training/programs',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const action = useApiMutation(
    (v: { id: number; verb: 'submit-review' | 'publish' | 'archive' }) =>
      apiClient.post(`/avatar-training/programs/${v.id}/${v.verb}`),
    {
      invalidateKeys: [queryKeys.avatarTraining.all],
      onSuccess: () => notify({ title: 'Formação actualizada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível actualizar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-20 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {isAuthor && (
          <div role="group" aria-label="Vista" className="flex gap-2">
            {(
              [
                ['catalog', 'Catálogo'],
                ['manage', 'Gestão'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-white text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="min-w-[180px] flex-1">
          <FormField label="Pesquisar" htmlFor="ap-search">
            <Input
              id="ap-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
        </div>
        <div className="min-w-[140px]">
          <FormField label="Categoria" htmlFor="ap-filter-cat">
            <Input
              id="ap-filter-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>
        </div>
        {manage && (
          <div className="min-w-[140px]">
            <FormField label="Estado" htmlFor="ap-status">
              <Select
                value={status}
                onValueChange={setStatus}
                items={[
                  { value: ALL, label: 'Todos' },
                  ...Object.entries(PROGRAM_STATUS).map(([value, v]) => ({
                    value,
                    label: v.label,
                  })),
                ]}
              />
            </FormField>
          </div>
        )}
        {manage && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nova formação
          </Button>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Sem formações com avatar"
          description={
            manage
              ? 'Crie a primeira formação para a poder atribuir a colaboradores.'
              : 'Ainda não existem formações publicadas para o seu perfil.'
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-semibold text-ink">
                  {p.title}
                </div>
                <div className="font-body text-xs text-ink-muted">
                  {p.code} · {EXPERIENCE_LABEL[p.experienceType]} · v{p.version}
                  {p._count ? ` · ${p._count.sessions} sessão(ões)` : ''}
                  {p.avatar ? ` · ${p.avatar.name}` : ''}
                  {p.course ? ` · curso: ${p.course.title}` : ''}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {DIFFICULTY_LABEL[p.difficulty] ?? p.difficulty}
                  {p.durationMinutes ? ` · ${p.durationMinutes} min` : ''}
                  {p.language ? ` · ${p.language.toUpperCase()}` : ''}
                  {p.category ? ` · ${p.category}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge value={p.status} map={PROGRAM_STATUS} variant="dot" />
                {manage && p.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => action.mutate({ id: p.id, verb: 'submit-review' })}
                  >
                    Submeter a revisão
                  </Button>
                )}
                {manage && isAdmin && p.status === 'IN_REVIEW' && (
                  <Button
                    size="sm"
                    onClick={() => action.mutate({ id: p.id, verb: 'publish' })}
                  >
                    Publicar
                  </Button>
                )}
                {manage && p.status !== 'ARCHIVED' && (
                  <Button
                    size="sm"
                    intent="ghost"
                    onClick={() => action.mutate({ id: p.id, verb: 'archive' })}
                  >
                    Arquivar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProgramModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
