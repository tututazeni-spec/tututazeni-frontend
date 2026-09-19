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

interface CourseModule {
  id: number;
  title: string;
  lessons: { id: number; title: string }[];
}

export function useCourseModules(courseId: string) {
  const id = Number(courseId);
  const query = useApiQuery<{ modules: CourseModule[] }>(
    ['live-classes-wizard', 'course-detail', id],
    `/courses/${id}`,
    { enabled: Number.isFinite(id) && id > 0, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return query.data?.modules ?? [];
}

// docs/aulas-ao-vivo.md secção 7 — "Liga aos formadores no módulo
// Trainings" — reaproveita o catálogo TrainingInstructorProfile em vez de
// duplicar uma gestão de formadores própria deste módulo.
export function useInstructorOptions() {
  const params = { limit: 200 };
  const query = useApiQuery<{ data: { id: number; name: string; entity?: string | null }[] }>(
    ['live-classes-wizard', 'instructors-picker'],
    '/training-trainers',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const options: PickerOption[] = (query.data?.data ?? []).map((t) => ({
    value: String(t.id),
    label: t.entity ? `${t.name} (${t.entity})` : t.name,
  }));
  return { options, loading: query.isLoading };
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
  const query = useApiQuery<OrgOption[]>(['live-classes-wizard', 'units-picker'], '/units', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  return Array.isArray(query.data) ? query.data : [];
}

export function usePositionOptions(): OrgOption[] {
  const query = useApiQuery<OrgOption[]>(['live-classes-wizard', 'positions-picker'], '/positions', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  return Array.isArray(query.data) ? query.data : [];
}
