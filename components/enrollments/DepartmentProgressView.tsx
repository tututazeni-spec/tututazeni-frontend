// components/enrollments/DepartmentProgressView.tsx
// Separador "Progresso" da aba Cursos, secção RH — docs/modulo_courses.md
// secção 4: "Para RH: Progresso por departamento/unidade". Consome
// GET /enrollments/by-department (novo endpoint, ver enrollments.service.ts).

'use client';

import { AlertTriangle, CircleCheck, ListChecks } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { PILL } from '@/components/courses/cardStyles';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressCard } from './ProgressCard';
import type { DepartmentProgressRow, ProgressByDepartment } from './types';

interface ProgressTableProps {
  title: string;
  tag: string;
  rows: DepartmentProgressRow[];
  pillClassName?: string;
}

function ProgressTable({
  title,
  tag,
  rows,
  pillClassName = 'bg-blue-500/20 text-blue-700',
}: ProgressTableProps) {
  return (
    <div>
      <span className={`${PILL} mb-3 ${pillClassName}`}>{title}</span>

      {rows.length === 0 ? (
        <EmptyState variant="inline" title="Sem inscrições registadas" />
      ) : (
        <div className="space-y-5">
          {rows.map((r) => (
            <ProgressCard
              key={r.id}
              seed={r.id}
              tag={tag}
              title={r.name}
              infos={[
                { icon: ListChecks, text: `Total: ${r.total}` },
                { icon: CircleCheck, text: `Concluídas: ${r.completed}` },
                {
                  icon: AlertTriangle,
                  text: `Atrasadas: ${r.overdue}`,
                  danger: r.overdue > 0,
                },
              ]}
              progress={{
                value: r.completionRate,
                label: 'Taxa de conclusão',
              }}
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
        wrapperClassName="space-y-2"
        itemClassName="h-20 rounded-panel bg-surface-sunken"
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
        tag="Departamento"
        rows={data.byDepartment}
      />
      <ProgressTable
        title="Progresso por unidade"
        tag="Unidade"
        rows={data.byUnit}
        pillClassName="bg-emerald-500/20 text-emerald-700"
      />
    </div>
  );
}
