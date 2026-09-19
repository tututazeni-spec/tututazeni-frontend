// components/enrollments/DepartmentProgressView.tsx
// Separador "Progresso" da aba Cursos, secção RH — docs/modulo_courses.md
// secção 4: "Para RH: Progresso por departamento/unidade". Consome
// GET /enrollments/by-department (novo endpoint, ver enrollments.service.ts).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentProgressRow, ProgressByDepartment } from './types';

function ProgressTable({ title, rows }: { title: string; rows: DepartmentProgressRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem inscrições registadas</p>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_70px_70px_70px_160px] gap-3 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Nome</div>
            <div>Total</div>
            <div>Concluídas</div>
            <div>Atrasadas</div>
            <div>Taxa de conclusão</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_70px_70px_70px_160px] items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
            >
              <div className="truncate text-sm text-ink">{r.name}</div>
              <div className="font-mono text-sm text-ink-muted">{r.total}</div>
              <div className="font-mono text-sm text-success-ink">{r.completed}</div>
              <div
                className={`font-mono text-sm ${r.overdue > 0 ? 'font-semibold text-danger-ink' : 'text-ink-faint'}`}
              >
                {r.overdue}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ProgressBar value={r.completionRate} />
                </div>
                <span className="w-8 font-mono text-xs text-ink-muted">{r.completionRate}%</span>
              </div>
            </div>
          ))}
        </>
      )}
    </Card>
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
        itemClassName="h-16 rounded-card bg-surface-sunken"
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
      <ProgressTable title="Progresso por departamento" rows={data.byDepartment} />
      <ProgressTable title="Progresso por unidade" rows={data.byUnit} />
    </div>
  );
}
