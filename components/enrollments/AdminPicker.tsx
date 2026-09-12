// components/enrollments/AdminPicker.tsx
// Passo 1 da "Gestão (Admin)" — seleccionar um curso ou uma formação antes de
// ver os matriculados. O ciclo pedido é sempre seleccionar → ver lista, nunca
// uma tabela plana com todas as matrículas misturadas. O conteúdo desta lista
// já vem escopado por papel a partir do backend:
//   - ADMIN/RH/DIRECTOR → catálogo completo
//   - GESTOR/LIDER      → só cursos/formações com matriculados do seu departamento
//   - INSTRUCTOR        → só o que lecciona
// Ver EnrollmentsService.getManageableCourses / TrainingService.getManageableTrainings.

'use client';

import { useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  ManageableCourse,
  ManageableSelection,
  ManageableTraining,
} from './types';

interface AdminPickerProps {
  onSelect: (selection: ManageableSelection) => void;
}

export function AdminPicker({ onSelect }: AdminPickerProps) {
  const [search, setSearch] = useState('');

  const { data: courses = [], isLoading: coursesLoading } = useApiQuery<
    ManageableCourse[]
  >(queryKeys.enrollments.manageableCourses(), '/enrollments/manageable-courses', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  const { data: trainings = [], isLoading: trainingsLoading } = useApiQuery<
    ManageableTraining[]
  >(queryKeys.trainings.manageable(), '/trainings/manageable', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = q
      ? courses.filter((x) => x.title.toLowerCase().includes(q))
      : courses;
    const t = q
      ? trainings.filter((x) => x.title.toLowerCase().includes(q))
      : trainings;
    return { courses: c, trainings: t };
  }, [search, courses, trainings]);

  const loading = coursesLoading || trainingsLoading;
  const isEmpty =
    !loading && courses.length === 0 && trainings.length === 0;

  return (
    <div>
      <p className="mb-4 text-sm text-ink-faint">
        Seleccione um curso ou uma formação para ver os respectivos
        matriculados.
      </p>

      <div className="relative mb-5">
        <Search
          size={16}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar curso ou formação…"
          className="pl-9"
        />
      </div>

      {loading && (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}

      {isEmpty && (
        <div className="rounded-card border border-dashed border-border py-12 text-center text-sm text-ink-faint">
          Sem cursos ou formações disponíveis para gerir.
        </div>
      )}

      {!loading && !isEmpty && (
        <div className="space-y-5">
          {filtered.courses.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                Cursos
              </div>
              <div className="space-y-2">
                {filtered.courses.map((c) => (
                  <button
                    key={`course-${c.id}`}
                    type="button"
                    onClick={() =>
                      onSelect({ kind: 'course', id: c.id, title: c.title })
                    }
                    className="flex w-full items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-subtle"
                  >
                    <BookOpen
                      size={18}
                      strokeWidth={1.75}
                      className="flex-shrink-0 text-ink-faint"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {c.title}
                      </div>
                      {c.category && (
                        <div className="text-xs text-ink-faint">
                          {c.category}
                        </div>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-ink-faint">
                      {c.enrollments} matriculado(s)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered.trainings.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                Formações
              </div>
              <div className="space-y-2">
                {filtered.trainings.map((t) => (
                  <button
                    key={`training-${t.id}`}
                    type="button"
                    onClick={() =>
                      onSelect({ kind: 'training', id: t.id, title: t.title })
                    }
                    className="flex w-full items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-subtle"
                  >
                    <GraduationCap
                      size={18}
                      strokeWidth={1.75}
                      className="flex-shrink-0 text-ink-faint"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {t.title}
                      </div>
                      {t.category && (
                        <div className="text-xs text-ink-faint">
                          {t.category}
                        </div>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-ink-faint">
                      {t.participants} matriculado(s)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
