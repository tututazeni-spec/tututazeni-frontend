// components/avatar-training/ProgramsTab.tsx
// Formações com Avatar (docs/Avatar_Training.md §2/§4). «Catálogo» (todos): só
// formações publicadas, com pesquisa e categoria. «Gestão» (autoria): criação,
// envio para revisão, publicação (ADMIN/RH) e arquivo. Os papéis espelham
// @Roles em src/avatar-training/avatar-training.controller.ts.

'use client';

import { useState, type ReactNode } from 'react';
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
import { formatDate } from '@/lib/format';
import {
  ADMIN_ROLES,
  AUTHOR_ROLES,
  DIFFICULTY_LABEL,
  EXPERIENCE_LABEL,
  LANGUAGE_ITEMS,
  PROGRAM_STATUS,
  SOURCE_LABEL,
} from './constants';
import { NO_USER, useUserOptions } from './useUserOptions';
import type {
  AvatarProgram,
  AvatarProgramDetail,
  CertificationStatus,
  TrainingAvatar,
} from './types';

const ALL = 'ALL';

const DIFFICULTY_ITEMS = Object.entries(DIFFICULTY_LABEL).map(([value, label]) => ({
  value,
  label,
}));
const EXPERIENCE_ITEMS = Object.entries(EXPERIENCE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

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

function ProgramFormModal({
  program,
  onClose,
  onSaved,
}: {
  /** Presente = edição (ficha completa); ausente = criação. */
  program?: AvatarProgramDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const notify = useToast();
  const users = useUserOptions();
  const [title, setTitle] = useState(program?.title ?? '');
  const [description, setDescription] = useState(program?.description ?? '');
  const [objectives, setObjectives] = useState((program?.objectives ?? []).join('\n'));
  const [category, setCategory] = useState(program?.category ?? '');
  const [difficulty, setDifficulty] = useState(program?.difficulty ?? 'BEGINNER');
  const [experienceType, setExperienceType] = useState<string>(
    program?.experienceType ?? 'GUIDED_LESSON',
  );
  const [language, setLanguage] = useState(program?.language ?? 'pt');
  const [variant, setVariant] = useState(program?.languageVariant ?? '');
  const [duration, setDuration] = useState(
    program?.durationMinutes ? String(program.durationMinutes) : '',
  );
  const [courseId, setCourseId] = useState(program?.courseId ? String(program.courseId) : ALL);
  const [moduleId, setModuleId] = useState(program?.moduleId ? String(program.moduleId) : ALL);
  const [avatarId, setAvatarId] = useState(program?.avatarId ? String(program.avatarId) : ALL);
  const [responsible, setResponsible] = useState(
    program?.responsibleId ? String(program.responsibleId) : NO_USER,
  );
  const [prerequisites, setPrerequisites] = useState<number[]>(
    program?.prerequisiteCourseIds ?? [],
  );
  const [departments, setDepartments] = useState<number[]>(program?.targetDepartmentIds ?? []);
  const [roleNames, setRoleNames] = useState((program?.targetRoleNames ?? []).join(', '));
  const [competencies, setCompetencies] = useState<number[]>(program?.competencyIds ?? []);
  const [certificate, setCertificate] = useState(program?.certificateEnabled ?? false);
  const [minScore, setMinScore] = useState(
    program?.certificateMinScore != null ? String(program.certificateMinScore) : '',
  );
  const [allSessions, setAllSessions] = useState(
    program?.certificateRequireAllSessions ?? true,
  );

  const avatars = useApiQuery<TrainingAvatar[]>(
    queryKeys.avatarTraining.avatars(),
    '/avatar-training/avatars',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  // Módulos do curso escolhido (o detalhe do curso traz-os).
  const courseDetail = useApiQuery<{ modules?: { id: number; title: string }[] }>(
    ['avatar-training', 'course-modules', courseId],
    `/courses/${courseId}`,
    { enabled: courseId !== ALL, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const moduleOptions = courseId === ALL ? [] : (courseDetail.data?.modules ?? []);

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
    () => {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        objectives: lines(objectives),
        category: category.trim() || undefined,
        difficulty,
        experienceType,
        language,
        languageVariant: variant.trim() || undefined,
        durationMinutes: duration ? Number(duration) : undefined,
        courseId: courseId === ALL ? undefined : Number(courseId),
        moduleId: moduleId === ALL ? undefined : Number(moduleId),
        avatarId: avatarId === ALL ? undefined : Number(avatarId),
        responsibleId: responsible === NO_USER ? undefined : Number(responsible),
        prerequisiteCourseIds: prerequisites,
        targetDepartmentIds: departments,
        targetRoleNames: roleNames
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        competencyIds: competencies,
        certificateEnabled: certificate,
        certificateMinScore: certificate && minScore !== '' ? Number(minScore) : undefined,
        certificateRequireAllSessions: allSessions,
      };
      return program
        ? apiClient.patch(`/avatar-training/programs/${program.id}`, body)
        : apiClient.post('/avatar-training/programs', body);
    },
    {
      invalidateKeys: [queryKeys.avatarTraining.all],
      onSuccess: () => {
        notify({
          title: program ? 'Formação actualizada' : 'Formação criada',
          intent: 'success',
        });
        onSaved();
        onClose();
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível guardar a formação',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const minScoreInvalid =
    minScore !== '' &&
    (!Number.isInteger(Number(minScore)) || Number(minScore) < 0 || Number(minScore) > 100);

  const durationInvalid =
    duration !== '' &&
    (!Number.isInteger(Number(duration)) ||
      Number(duration) < 1 ||
      Number(duration) > 1440);

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={program ? 'Editar formação com avatar' : 'Nova formação com avatar'}
        description={
          program?.status === 'IN_REVIEW'
            ? 'Editar uma formação em revisão devolve-a a rascunho.'
            : 'Fica em rascunho até ser revista e publicada.'
        }
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
            <FormField label="Variante do idioma" htmlFor="ap-variant" hint="Ex.: PT-AO, PT-PT.">
              <Input
                id="ap-variant"
                value={variant}
                maxLength={20}
                onChange={(e) => setVariant(e.target.value)}
              />
            </FormField>
            <FormField label="Curso associado" htmlFor="ap-course">
              <Combobox
                value={courseId}
                onValueChange={(v) => {
                  setCourseId(v);
                  setModuleId(ALL);
                }}
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
            <FormField label="Módulo do curso" htmlFor="ap-module">
              <Select
                value={moduleId}
                onValueChange={setModuleId}
                disabled={courseId === ALL}
                items={[
                  { value: ALL, label: 'Curso inteiro' },
                  ...moduleOptions.map((m) => ({ value: String(m.id), label: m.title })),
                ]}
              />
            </FormField>
            <FormField label="Avatar (instrutor virtual)" htmlFor="ap-avatar">
              <Select
                value={avatarId}
                onValueChange={setAvatarId}
                items={[
                  { value: ALL, label: 'Sem avatar por defeito' },
                  ...(avatars.data ?? [])
                    .filter((a) => a.status === 'ACTIVE' || String(a.id) === avatarId)
                    .map((a) => ({ value: String(a.id), label: a.name })),
                ]}
              />
            </FormField>
            <FormField label="Formador responsável" htmlFor="ap-resp">
              <Select value={responsible} onValueChange={setResponsible} items={users} />
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
          {certificate && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Nota média mínima (0-100)"
                htmlFor="ap-minscore"
                hint="Vazio = sem nota mínima."
                error={minScoreInvalid ? 'Entre 0 e 100' : undefined}
              >
                <Input
                  id="ap-minscore"
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
              </FormField>
              <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-ink">
                <input
                  type="checkbox"
                  checked={allSessions}
                  onChange={(e) => setAllSessions(e.target.checked)}
                />
                Exigir todas as sessões obrigatórias concluídas
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button intent="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={create.isPending}
            disabled={!title.trim() || durationInvalid || minScoreInvalid}
            onClick={() => create.mutate(undefined)}
          >
            {program ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 font-body text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="col-span-2 text-ink">{children}</dd>
    </div>
  );
}

// Ficha da formação (§4): identificação, responsáveis, aprovação, avaliação,
// fontes aprovadas e regras de certificação num só sítio.
function ProgramSheetModal({
  programId,
  canEdit,
  onClose,
  onEdit,
}: {
  programId: number;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (p: AvatarProgramDetail) => void;
}) {
  const { data, error, refetch } = useApiQuery<AvatarProgramDetail>(
    queryKeys.avatarTraining.program(programId),
    `/avatar-training/programs/${programId}`,
    { staleTime: 0 },
  );
  const cert = useApiQuery<CertificationStatus>(
    [...queryKeys.avatarTraining.program(programId), 'certification'],
    `/avatar-training/programs/${programId}/certification`,
    { enabled: data?.status === 'PUBLISHED' && !!data?.certificateEnabled, staleTime: 0 },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={data ? `${data.code} — ${data.title}` : 'Ficha da formação'}
        description="Ficha completa da formação virtual."
      >
        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {error ? (
            <QueryError error={error} onRetry={() => refetch()} />
          ) : !data ? (
            <Skeleton rows={4} itemClassName="h-6 rounded bg-surface-sunken animate-pulse" />
          ) : (
            <>
              <dl className="space-y-2">
                <Row label="Estado">
                  <StatusBadge value={data.status} map={PROGRAM_STATUS} variant="dot" /> · v
                  {data.version}
                </Row>
                {data.description && <Row label="Descrição">{data.description}</Row>}
                {data.objectives.length > 0 && (
                  <Row label="Objectivos">
                    <ul className="list-disc pl-4">
                      {data.objectives.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </Row>
                )}
                <Row label="Categoria e nível">
                  {data.category ?? '—'} · {DIFFICULTY_LABEL[data.difficulty] ?? data.difficulty}
                </Row>
                <Row label="Experiência">{EXPERIENCE_LABEL[data.experienceType]}</Row>
                <Row label="Idioma e duração">
                  {(data.language ?? 'pt').toUpperCase()}
                  {data.languageVariant ? ` (${data.languageVariant})` : ''}
                  {data.durationMinutes ? ` · ${data.durationMinutes} min` : ''}
                </Row>
                <Row label="Avatar">{data.avatar?.name ?? 'Sem avatar por defeito'}</Row>
                <Row label="Formador responsável">{data.responsibleName ?? '—'}</Row>
                <Row label="Curso associado">
                  {data.course?.title ?? '—'}
                  {data.moduleId ? ` · módulo #${data.moduleId}` : ''}
                </Row>
                <Row label="Aprovação">
                  {data.approvedAt
                    ? `${data.approvedByName ?? 'Responsável'} em ${formatDate(data.approvedAt)}`
                    : 'Ainda não aprovada'}
                </Row>
                <Row label="Certificação">
                  {data.certificateEnabled
                    ? `Sim${
                        data.certificateMinScore != null
                          ? ` · nota média mínima ${data.certificateMinScore}`
                          : ''
                      }${data.certificateRequireAllSessions ? ' · todas as sessões obrigatórias' : ''}`
                    : 'Não emite certificado'}
                </Row>
                {cert.data?.enabled && (
                  <Row label="A minha elegibilidade">
                    {cert.data.eligible ? (
                      'Elegível ao certificado'
                    ) : (
                      <ul className="list-disc pl-4">
                        {cert.data.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </Row>
                )}
              </dl>

              <section>
                <h3 className="mb-1 font-display text-sm font-semibold text-ink">
                  Sessões, avaliação e fontes aprovadas
                </h3>
                {data.sessions.length === 0 ? (
                  <p className="font-body text-xs text-ink-faint">Sem sessões.</p>
                ) : (
                  <div className="space-y-2">
                    {data.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-card border border-border bg-surface p-2 font-body text-xs"
                      >
                        <div className="text-sm font-medium text-ink">
                          {s.position}. {s.title}
                          {s.mandatory ? ' · obrigatória' : ''}
                        </div>
                        <div className="text-ink-muted">
                          {s.assessment
                            ? `Avaliação: nota mínima ${s.assessment.passingScore}, ${
                                s.assessment.maxAttempts
                                  ? `${s.assessment.maxAttempts} tentativa(s)`
                                  : 'tentativas ilimitadas'
                              }${s.assessment.requireFormalAssessment ? ', avaliação formal' : ''}`
                            : 'Sem avaliação configurada'}
                        </div>
                        <div className="text-ink-faint">
                          {s.knowledgeSources.length
                            ? `Fontes: ${s.knowledgeSources
                                .map((k) => k.title ?? `${SOURCE_LABEL[k.sourceType]} ${k.id}`)
                                .join('; ')}`
                            : 'Sem fontes aprovadas'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-3">
          {canEdit && data && data.status !== 'ARCHIVED' && (
            <Button size="sm" intent="secondary" onClick={() => onEdit(data)}>
              Editar
            </Button>
          )}
          <Button size="sm" intent="ghost" onClick={onClose}>
            Fechar
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
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [editing, setEditing] = useState<AvatarProgramDetail | null>(null);
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
                <Button size="sm" intent="ghost" onClick={() => setSheetId(p.id)}>
                  Ficha
                </Button>
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
        <ProgramFormModal onClose={() => setShowCreate(false)} onSaved={() => refetch()} />
      )}
      {editing && (
        <ProgramFormModal
          key={editing.id}
          program={editing}
          onClose={() => setEditing(null)}
          onSaved={() => refetch()}
        />
      )}
      {sheetId !== null && !editing && (
        <ProgramSheetModal
          programId={sheetId}
          canEdit={isAuthor && mode === 'manage'}
          onClose={() => setSheetId(null)}
          onEdit={(p) => {
            setSheetId(null);
            setEditing(p);
          }}
        />
      )}
    </div>
  );
}
