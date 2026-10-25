// components/avatar-training/programs/logic.ts
// Regras do separador «Formações» do Avatar Training (docs/Avatar_Training.md
// §2/§4) sem React: valores e validação do formulário, corpo do pedido,
// parâmetros da lista, acções disponíveis por estado e os textos da ficha.
// Extraído de ProgramsTab.tsx.

import { formatDate } from '@/lib/format';
import {
  AVATAR_STATUS,
  CATEGORY_OPTIONS,
  DIFFICULTY_LABEL,
  SOURCE_LABEL,
  VARIANT_OPTIONS,
} from '../constants';
import { NO_USER } from '../useUserOptions';
import type {
  AvatarProgram,
  AvatarProgramDetail,
  ProgramLinks,
  ProgramSessionSummary,
  TrainingAvatar,
} from '../types';

export const ALL = 'ALL';
/** Valor da opção «Outra (escrever)» na lista de categorias. */
export const OTHER = '__OTHER__';

// ── Formulário ──────────────────────────────────────────────────────────────

export interface ProgramFormValues {
  title: string;
  description: string;
  objectives: string[];
  category: string;
  /** «Outra» na lista de categorias abre um campo para escrever. */
  otherCategory: boolean;
  difficulty: string;
  experienceType: string;
  language: string;
  variant: string;
  duration: string;
  courseId: string;
  moduleId: string;
  avatarId: string;
  responsible: string;
  prerequisites: number[];
  departments: number[];
  roleNames: string[];
  competencies: number[];
  certificate: boolean;
  minScore: string;
  allSessions: boolean;
}

/** Valores iniciais: os da formação em edição, ou os por omissão na criação. */
export function initialProgramForm(
  program?: AvatarProgramDetail,
): ProgramFormValues {
  return {
    title: program?.title ?? '',
    description: program?.description ?? '',
    objectives: program?.objectives ?? [],
    category: program?.category ?? '',
    otherCategory:
      !!program?.category && !CATEGORY_OPTIONS.includes(program.category),
    difficulty: program?.difficulty ?? 'BEGINNER',
    experienceType: program?.experienceType ?? 'GUIDED_LESSON',
    language: program?.language ?? 'pt',
    variant: program?.languageVariant ?? '',
    duration: program?.durationMinutes ? String(program.durationMinutes) : '',
    courseId: program?.courseId ? String(program.courseId) : ALL,
    moduleId: program?.moduleId ? String(program.moduleId) : ALL,
    avatarId: program?.avatarId ? String(program.avatarId) : ALL,
    responsible: program?.responsibleId
      ? String(program.responsibleId)
      : NO_USER,
    prerequisites: program?.prerequisiteCourseIds ?? [],
    departments: program?.targetDepartmentIds ?? [],
    roleNames: program?.targetRoleNames ?? [],
    competencies: program?.competencyIds ?? [],
    certificate: program?.certificateEnabled ?? false,
    minScore:
      program?.certificateMinScore != null
        ? String(program.certificateMinScore)
        : '',
    allSessions: program?.certificateRequireAllSessions ?? true,
  };
}

/** Escolher «Outra» abre o campo livre e limpa a categoria; «Sem» também limpa. */
export function chooseCategory(
  f: ProgramFormValues,
  v: string,
): ProgramFormValues {
  return {
    ...f,
    otherCategory: v === OTHER,
    category: v === ALL || v === OTHER ? '' : v,
  };
}

/** A variante pertence ao idioma: mudar o idioma limpa-a. */
export const chooseLanguage = (
  f: ProgramFormValues,
  language: string,
): ProgramFormValues => ({ ...f, language, variant: '' });

/** O módulo pertence ao curso: mudar o curso volta a «curso inteiro». */
export const chooseCourse = (
  f: ProgramFormValues,
  courseId: string,
): ProgramFormValues => ({ ...f, courseId, moduleId: ALL });

/** Acrescenta um objectivo escrito à mão; vazio ou repetido não faz nada. */
export function addObjective(objectives: string[], text: string): string[] {
  const v = text.trim();
  return v && !objectives.includes(v) ? [...objectives, v] : objectives;
}

/** Opções predefinidas mais valores já gravados que já não constam da lista. */
export const withCurrent = (base: string[], current: string[]): string[] => [
  ...base,
  ...current.filter((c) => !base.includes(c)),
];

export const isMinScoreInvalid = (minScore: string): boolean =>
  minScore !== '' &&
  (!Number.isInteger(Number(minScore)) ||
    Number(minScore) < 0 ||
    Number(minScore) > 100);

export const isDurationInvalid = (duration: string): boolean =>
  duration !== '' &&
  (!Number.isInteger(Number(duration)) ||
    Number(duration) < 1 ||
    Number(duration) > 1440);

/** Gravar exige título e, quando preenchidos, duração e nota mínima válidas. */
export const canSaveProgram = (f: ProgramFormValues): boolean =>
  !!f.title.trim() &&
  !isDurationInvalid(f.duration) &&
  !isMinScoreInvalid(f.minScore);

export function buildProgramPayload(f: ProgramFormValues) {
  return {
    title: f.title.trim(),
    description: f.description.trim() || undefined,
    objectives: f.objectives,
    category: f.category || undefined,
    difficulty: f.difficulty,
    experienceType: f.experienceType,
    language: f.language,
    languageVariant: f.variant || undefined,
    durationMinutes: f.duration ? Number(f.duration) : undefined,
    courseId: f.courseId === ALL ? undefined : Number(f.courseId),
    moduleId: f.moduleId === ALL ? undefined : Number(f.moduleId),
    avatarId: f.avatarId === ALL ? undefined : Number(f.avatarId),
    responsibleId:
      f.responsible === NO_USER ? undefined : Number(f.responsible),
    prerequisiteCourseIds: f.prerequisites,
    targetDepartmentIds: f.departments,
    targetRoleNames: f.roleNames,
    competencyIds: f.competencies,
    certificateEnabled: f.certificate,
    certificateMinScore:
      f.certificate && f.minScore !== '' ? Number(f.minScore) : undefined,
    certificateRequireAllSessions: f.allSessions,
  };
}

// ── Opções dos selectores ───────────────────────────────────────────────────

interface SelectItem {
  value: string;
  label: string;
}

/** Variantes do idioma; uma variante já gravada e entretanto retirada mantém-se. */
export function variantItems(language: string, variant: string): SelectItem[] {
  const known = VARIANT_OPTIONS[language] ?? [];
  return [
    { value: ALL, label: 'Sem variante' },
    ...known,
    ...(variant && !known.some((o) => o.value === variant)
      ? [{ value: variant, label: variant }]
      : []),
  ];
}

/** Só avatares activos ou em teste (mais o já escolhido), com o estado no nome. */
export function avatarItems(
  avatars: TrainingAvatar[],
  selectedId: string,
): SelectItem[] {
  return [
    { value: ALL, label: 'Sem avatar' },
    ...avatars
      .filter(
        (a) =>
          a.status === 'ACTIVE' ||
          a.status === 'TESTING' ||
          String(a.id) === selectedId,
      )
      .map((a) => ({
        value: String(a.id),
        label:
          a.status === 'ACTIVE'
            ? a.name
            : `${a.name} (${AVATAR_STATUS[a.status].label})`,
      })),
  ];
}

// ── Lista ───────────────────────────────────────────────────────────────────

export interface ProgramFilters {
  search: string;
  category: string;
  status: string;
  /** Vista «Gestão» de quem tem autoria. */
  manage: boolean;
}

export function programListParams(f: ProgramFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (f.search.trim()) params.search = f.search.trim();
  if (f.category.trim()) params.category = f.category.trim();
  // Catálogo mostra só o publicado, mesmo para quem tem acesso a rascunhos.
  if (!f.manage) params.status = 'PUBLISHED';
  else if (f.status !== ALL) params.status = f.status;
  return params;
}

/** Que botões de ciclo de vida cada cartão oferece. */
export function programActions(
  p: Pick<AvatarProgram, 'status'>,
  manage: boolean,
  isAdmin: boolean,
) {
  return {
    canSubmitReview: manage && p.status === 'DRAFT',
    canPublish: manage && isAdmin && p.status === 'IN_REVIEW',
    canArchive: manage && p.status !== 'ARCHIVED',
  };
}

// ── Ficha ───────────────────────────────────────────────────────────────────

export const categoryAndLevel = (p: AvatarProgramDetail): string =>
  `${p.category ?? '—'} · ${DIFFICULTY_LABEL[p.difficulty] ?? p.difficulty}`;

export const languageAndDuration = (p: AvatarProgramDetail): string =>
  `${(p.language ?? 'pt').toUpperCase()}${
    p.languageVariant ? ` (${p.languageVariant})` : ''
  }${p.durationMinutes ? ` · ${p.durationMinutes} min` : ''}`;

export const courseSummary = (p: AvatarProgramDetail): string =>
  `${p.course?.title ?? '—'}${p.moduleId ? ` · módulo #${p.moduleId}` : ''}`;

export const approvalSummary = (p: AvatarProgramDetail): string =>
  p.approvedAt
    ? `${p.approvedByName ?? 'Responsável'} em ${formatDate(p.approvedAt)}`
    : 'Ainda não aprovada';

export const certificationSummary = (p: AvatarProgramDetail): string =>
  p.certificateEnabled
    ? `Sim${
        p.certificateMinScore != null
          ? ` · nota média mínima ${p.certificateMinScore}`
          : ''
      }${p.certificateRequireAllSessions ? ' · todas as sessões obrigatórias' : ''}`
    : 'Não emite certificado';

export const sessionHeading = (s: ProgramSessionSummary): string =>
  `${s.position}. ${s.title}${s.mandatory ? ' · obrigatória' : ''}`;

export const assessmentSummary = (s: ProgramSessionSummary): string =>
  s.assessment
    ? `Avaliação: nota mínima ${s.assessment.passingScore}, ${
        s.assessment.maxAttempts
          ? `${s.assessment.maxAttempts} tentativa(s)`
          : 'tentativas ilimitadas'
      }${s.assessment.requireFormalAssessment ? ', avaliação formal' : ''}`
    : 'Sem avaliação configurada';

export const sourcesSummary = (s: ProgramSessionSummary): string =>
  s.knowledgeSources.length
    ? `Fontes: ${s.knowledgeSources
        .map((k) => k.title ?? `${SOURCE_LABEL[k.sourceType]} ${k.id}`)
        .join('; ')}`
    : 'Sem fontes aprovadas';

export const linkedTrainingLabel = (
  t: ProgramLinks['trainings'][number],
): string =>
  `${t.title}${t.trainingPlanId ? ` · plano #${t.trainingPlanId}` : ''}`;

export const learningPathLabel = (
  l: ProgramLinks['learningPaths'][number],
): string => `${l.title}${l.mandatory ? ' · obrigatório' : ''}`;

/** A elegibilidade só se consulta numa formação publicada com certificado. */
export const shouldCheckEligibility = (
  p: Pick<AvatarProgramDetail, 'status' | 'certificateEnabled'> | undefined,
): boolean => p?.status === 'PUBLISHED' && !!p?.certificateEnabled;

/** As ligações a Trainings/Percursos só interessam a quem edita, com curso associado. */
export const shouldLoadLinks = (
  canEdit: boolean,
  p: Pick<AvatarProgramDetail, 'courseId'> | undefined,
): boolean => canEdit && !!p?.courseId;
