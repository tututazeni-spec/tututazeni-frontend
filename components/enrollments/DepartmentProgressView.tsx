// components/enrollments/DepartmentProgressView.tsx
// Separador "Progresso" da aba Cursos, secção RH — docs/modulo_courses.md
// secção 4: "Para RH: Progresso por departamento/unidade". Consome
// GET /enrollments/by-department (novo endpoint, ver enrollments.service.ts).

'use client';

import {
  AlertTriangle,
  CircleCheck,
  ListChecks,
  TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { PILL } from '@/components/courses/cardStyles';
import { NavyCard } from '@/components/courses/NavyCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentProgressRow, ProgressByDepartment } from './types';

function ProgressTable({
  title,
  rows,
  pillClassName = 'bg-blue-500/20 text-blue-700',
}: {
  title: string;
  rows: DepartmentProgressRow[];
  pillClassName?: string;
}) {
  return (
    <div>
      <span className={`${PILL} mb-3 ${pillClassName}`}>
        {title}
      </span>

      {rows.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem inscrições registadas</p>
      ) : (
        <div className="space-y-5">
          {rows.map((r) => (
            <NavyCard
              key={r.id}
              title={r.name}
              infos={[
                { icon: ListChecks, value: String(r.total), label: 'Total' },
                {
                  icon: CircleCheck,
                  value: String(r.completed),
                  label: 'Concluídas',
                },
                {
                  icon: AlertTriangle,
                  value: String(r.overdue),
                  label: 'Atrasadas',
                  danger: r.overdue > 0,
                },
                {
                  icon: TrendingUp,
                  value: `${Math.round(r.completionRate)}%`,
                  label: 'Taxa de conclusão',
                },
              ]}
            />
          ))}
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
      <ProgressTable
        title="Progresso por unidade"
        rows={data.byUnit}
        pillClassName="bg-emerald-500/20 text-emerald-700"
      />
    </div>
  );
}
