// components/enrollments/DepartmentProgressView.tsx
// Separador "Progresso" da aba Cursos, secção RH — docs/modulo_courses.md
// secção 4: "Para RH: Progresso por departamento/unidade". Consome
// GET /enrollments/by-department (novo endpoint, ver enrollments.service.ts).

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CircleCheck,
  ListChecks,
  MapPin,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
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
        <div className="space-y-3">
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

const ALL = 'ALL';
/** Opção que limpa o filtro (o Select não aceita valor vazio). */
const NONE = 'NONE';

function filterItems(label: string, rows: DepartmentProgressRow[]) {
  return [
    { value: NONE, label: 'Vazio (sem filtro)' },
    { value: ALL, label },
    ...rows.map((r) => ({ value: String(r.id), label: r.name })),
  ];
}

export function DepartmentProgressView() {
  // '' = ainda sem escolha: a secção só aparece depois de escolher no filtro.
  const [departmentId, setDepartmentId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
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

  const byPosition = data.byPosition ?? [];
  const only = (rows: DepartmentProgressRow[], id: string) =>
    id === ALL ? rows : rows.filter((r) => String(r.id) === id);

  return (
    <div className="space-y-4">
      {/* Filtros Underline */}
      <Card>
        <CardBody className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <Select
            variant="underline"
            icon={Building2}
            placeholder="Escolher departamento…"
            items={filterItems('Todos os departamentos', data.byDepartment)}
            value={departmentId}
            onValueChange={(v) => setDepartmentId(v === NONE ? '' : v)}
          />
          <Select
            variant="underline"
            icon={MapPin}
            placeholder="Escolher unidade…"
            items={filterItems('Todas as unidades', data.byUnit)}
            value={unitId}
            onValueChange={(v) => setUnitId(v === NONE ? '' : v)}
          />
          <Select
            variant="underline"
            icon={Briefcase}
            placeholder="Escolher função…"
            items={filterItems('Todas as funções', byPosition)}
            value={positionId}
            onValueChange={(v) => setPositionId(v === NONE ? '' : v)}
          />
        </CardBody>
      </Card>

      {!departmentId && !unitId && !positionId && (
        <EmptyState
          title="Escolha um filtro para ver o progresso"
          description="Escolha um departamento, uma unidade ou uma função acima."
        />
      )}
      {departmentId && (
        <ProgressTable
          title="Progresso por departamento"
          tag="Departamento"
          rows={only(data.byDepartment, departmentId)}
        />
      )}
      {unitId && (
        <ProgressTable
          title="Progresso por unidade"
          tag="Unidade"
          rows={only(data.byUnit, unitId)}
          pillClassName="bg-emerald-500/20 text-emerald-700"
        />
      )}
      {positionId && (
        <ProgressTable
          title="Progresso por função"
          tag="Função"
          rows={only(byPosition, positionId)}
          pillClassName="bg-violet-500/20 text-violet-700"
        />
      )}
    </div>
  );
}
