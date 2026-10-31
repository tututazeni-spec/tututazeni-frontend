// components/live-classes/wizard/wizardData.ts
// Hooks de dados para os pickers do assistente "Nova Aula" — mesmo padrão
// de components/trainings/TrainingFormModal.tsx (catálogos leves, sem
// acoplar este módulo aos outros).

import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';

export interface PickerOption {
  value: string;
  label: string;
}

export function useCourseOptions() {
  const params = { limit: 200 };
  const query = useApiQuery<{ data: { id: number; title: string }[] }>(
    ['live-classes-wizard', 'courses-picker'],
    '/courses',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const options: PickerOption[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
  return { options, loading: query.isLoading };
}

interface CourseLesson {
  id: number;
  title: string;
  durationMinutes?: number | null;
  learningObjectives?: string[];
}

interface CourseModule {
  id: number;
  title: string;
  learningObjectives?: string[];
  lessons: CourseLesson[];
}

interface CourseDetail {
  learningObjectives?: string[];
  modules: CourseModule[];
}

function useCourseDetail(courseId: string) {
  const id = Number(courseId);
  return useApiQuery<CourseDetail>(
    ['live-classes-wizard', 'course-detail', id],
    `/courses/${id}`,
    {
      enabled: Number.isFinite(id) && id > 0,
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
}

export function useCourseModules(courseId: string) {
  return useCourseDetail(courseId).data?.modules ?? [];
}

export interface ContentSuggestions {
  objectives: string[];
  agenda: string[];
  topics: string[];
}

const uniq = (list: (string | null | undefined)[]): string[] => [
  ...new Set(list.map((s) => s?.trim()).filter((s): s is string => !!s)),
];

/**
 * Opções para escolher na etapa "Conteúdo", tiradas do curso (e do módulo /
 * lição) escolhidos na etapa 1: objetivos de aprendizagem, lições com a
 * duração como agenda, e módulos + lições como tópicos.
 */
export function useContentSuggestions(
  courseId: string,
  moduleId: string,
  lessonId: string,
): ContentSuggestions {
  const course = useCourseDetail(courseId).data;
  const allModules = course?.modules ?? [];
  const modules = moduleId
    ? allModules.filter((m) => String(m.id) === moduleId)
    : allModules;
  const lessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const lesson = lessons.find((l) => String(l.id) === lessonId);

  return {
    objectives: uniq([
      ...(course?.learningObjectives ?? []),
      ...modules.flatMap((m) => m.learningObjectives ?? []),
      ...(lesson?.learningObjectives ?? []),
    ]),
    agenda: uniq(
      lessons.map((l) => {
        const dur = l.durationMinutes ? ` (${l.durationMinutes} min)` : '';
        const prefix = moduleId ? '' : `${l.moduleTitle} — `;
        return `${prefix}${l.title}${dur}`;
      }),
    ),
    topics: uniq([
      ...modules.map((m) => m.title),
      ...lessons.map((l) => l.title),
    ]),
  };
}

// docs/aulas-ao-vivo.md secção 7 — "Liga aos formadores no módulo
// Trainings" — reaproveita o catálogo TrainingInstructorProfile em vez de
// duplicar uma gestão de formadores própria deste módulo.
export function useInstructorOptions() {
  const params = { limit: 200 };
  const query = useApiQuery<{
    data: { id: number; name: string; entity?: string | null }[];
  }>(['live-classes-wizard', 'instructors-picker'], '/training-trainers', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const options: PickerOption[] = (query.data?.data ?? []).map((t) => ({
    value: String(t.id),
    label: t.entity ? `${t.name} (${t.entity})` : t.name,
  }));
  return { options, loading: query.isLoading };
}

// Biblioteca (`Document`) — pesquisa por título para escolher materiais.
export function useDocumentSearch(search: string) {
  const term = search.trim();
  const query = useApiQuery<{ data: { id: number; title: string }[] }>(
    ['live-classes-wizard', 'documents-picker', term],
    '/documents',
    {
      params: { search: term, limit: 10 },
      staleTime: STALE_TIME.DYNAMIC,
      enabled: term.length >= 2,
    },
  );
  return { results: query.data?.data ?? [], loading: query.isLoading };
}

export interface OrgOption {
  id: number;
  name: string;
}

export function useDepartmentOptions(): OrgOption[] {
  const query = useApiQuery<{ data: OrgOption[] }>(
    ['live-classes-wizard', 'departments-picker'],
    '/departments',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return query.data?.data ?? [];
}

export function useUnitOptions(): OrgOption[] {
  const query = useApiQuery<OrgOption[]>(
    ['live-classes-wizard', 'units-picker'],
    '/units',
    {
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
  return Array.isArray(query.data) ? query.data : [];
}

export function usePositionOptions(): OrgOption[] {
  const query = useApiQuery<OrgOption[]>(
    ['live-classes-wizard', 'positions-picker'],
    '/positions',
    {
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
  return Array.isArray(query.data) ? query.data : [];
}
