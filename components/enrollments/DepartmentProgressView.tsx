// components/enrollments/DepartmentProgressView.tsx
// Separador "Progresso" da aba Cursos, secção RH — docs/modulo_courses.md
// secção 4: "Para RH: Progresso por departamento/unidade". Consome
// GET /enrollments/by-department (novo endpoint, ver enrollments.service.ts).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { PANEL, PILL, ProgressRing } from '@/components/courses/cardStyles';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentProgressRow, ProgressByDepartment } from './types';

function progressAccent(r: DepartmentProgressRow) {
  if (r.overdue > 0) return 'border-l-red-500';
  if (r.completionRate >= 75) return 'border-l-emerald-500';
  if (r.completionRate >= 40) return 'border-l-orange-400';
  return 'border-l-blue-400';
}

function ProgressTable({
  title,
  rows,
}: {
  title: string;
  rows: DepartmentProgressRow[];
}) {
  return (
    <div>
      <span className={`${PILL} mb-3 bg-blue-500/20 text-blue-700`}>
        {title}
      </span>

      {rows.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem inscrições registadas</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Cabeçalho agrupado */}
          <div className="grid min-w-[640px] grid-cols-[1.4fr_2fr_120px] gap-3 px-4 pb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Nome</div>
            <div className="grid grid-cols-3 text-center">
              <div>Total</div>
              <div>Concluídas</div>
              <div>Atrasadas</div>
            </div>
            <div className="text-center">Taxa de conclusão</div>
          </div>

          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.id}
                className={`grid min-w-[640px] grid-cols-[1.4fr_2fr_120px] items-stretch gap-3 rounded-2xl border border-l-4 border-border bg-surface/60 p-3 shadow-sm backdrop-blur-md hover:bg-surface ${progressAccent(r)}`}
              >
                {/* 1. Nome */}
                <div className="flex min-w-0 items-center">
                  <div className="line-clamp-2 text-sm font-semibold uppercase text-ink">
                    {r.name}
                  </div>
                </div>

                {/* 2. Total, Concluídas & Atrasadas */}
                <div className={`${PANEL} grid grid-cols-3 items-center text-center`}>
                  <div className="font-mono text-sm text-ink-muted">
                    {r.total}
                  </div>
                  <div className="font-mono text-sm text-success-ink">
                    {r.completed}
                  </div>
                  <div
                    className={`font-mono text-sm ${r.overdue > 0 ? 'font-semibold text-danger-ink' : 'text-ink-faint'}`}
                  >
                    {r.overdue}
                  </div>
                </div>

                {/* 3. Taxa de conclusão */}
                <div className={`${PANEL} flex items-center justify-center`}>
                  <ProgressRing value={r.completionRate} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DepartmentProgressView() {
  const { data, isLoading } = useApiQuery<ProgressByDepartment>(
    queryKeys.enrollments.byDepartment(),
    '/enrollments/by-department',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-20 rounded-2xl bg-surface-sunken"
      />
    );

  if (data.byDepartment.length === 0 && data.byUnit.length === 0) {
    return (
      <EmptyState
        title="Sem inscrições ainda"
        description="Assim que houver colaboradores inscritos em cursos, o progresso agregado por departamento e unidade aparece aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ProgressTable
        title="Progresso por departamento"
        rows={data.byDepartment}
      />
      <ProgressTable title="Progresso por unidade" rows={data.byUnit} />
    </div>
  );
}
