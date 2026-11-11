// components/competencies/GapsView.tsx
// Separador "Gaps de Competências" (docs/módulo_competencies.md §7) — lista
// onde existe diferença entre o nível actual e o nível necessário (GET
// /competencies/gaps). Prioridade/Impacto/Estado são derivados no backend a
// partir do gap e do PDI associado, não persistidos. Mesmo padrão de
// components/competencies/EvaluationsView.tsx.

'use client';

import { useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarCheck,
  Flag,
  Layers,
  Target,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CATEGORY_CFG,
  GAP_IMPACT_CFG,
  GAP_PRIORITY_CFG,
  GAP_STATUS_CFG,
  POSITION_LEVEL_CFG,
} from './constants';
import {
  useCompetencyOptions,
  useDepartmentOptions,
  usePositionOptions,
  type DirectoryUser,
} from './modelFormData';
import { avatarColor } from './EvaluationsView';
import { UserFilterSearch } from './UserFilterSearch';
import { CompetencyExportMenu } from './CompetencyExportMenu';

import type { CompetencyGap } from './types';
import { getInitials, formatDateNumeric } from '@/lib/format';

const ALL = '';

const HIERARCHY_LEVEL_ITEMS = [
  { value: ALL, label: 'Nível hierárquico' },
  ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const PRIORITY_ITEMS = [
  { value: ALL, label: 'Prioridade' },
  ...Object.entries(GAP_PRIORITY_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Estado' },
  ...Object.entries(GAP_STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const COLUMNS = [
  { label: 'Colaborador' },
  { label: 'Competência' },
  { label: 'Nível atual', center: true },
  { label: 'Nível esperado', center: true },
  { label: 'Lacuna', center: true },
  { label: 'Prioridade' },
  { label: 'Crítica' },
  { label: 'Impacto' },
  { label: 'Identificado em' },
  { label: 'Plano associado' },
  { label: 'Estado' },
];

export function GapsView() {
  const [departmentId, setDepartmentId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [competencyId, setCompetencyId] = useState(ALL);
  const [hierarchyLevel, setHierarchyLevel] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [user, setUser] = useState<DirectoryUser | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: positionOptions } = usePositionOptions();
  const { options: competencyOptions } = useCompetencyOptions();

  const params = {
    departmentId: departmentId === ALL ? undefined : departmentId,
    positionId: positionId === ALL ? undefined : positionId,
    competencyId: competencyId === ALL ? undefined : competencyId,
    hierarchyLevel: hierarchyLevel === ALL ? undefined : hierarchyLevel,
    priority: priority === ALL ? undefined : priority,
    status: status === ALL ? undefined : status,
    userId: user?.id,
  };

  // Sem nenhum filtro seleccionado só se mostra o cabeçalho da tabela.
  const hasFilter = Object.values(params).some((v) => v !== undefined);

  const { data: rows, isLoading: loading } = useApiQuery<CompetencyGap[]>(
    queryKeys.competencies.gaps(params),
    '/competencies/gaps',
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: hasFilter },
  );

  const buildExport = () => ({
    title: 'Lacunas de competências',
    filename: 'lacunas-de-competencias',
    headers: COLUMNS.map((c) => c.label),
    rows: (rows ?? []).map((r) => [
      `${r.colaborador} (${r.departamento ?? '—'} · ${r.cargo ?? '—'})`,
      r.competencia,
      r.nivelAtual,
      r.nivelEsperado,
      r.gap,
      GAP_PRIORITY_CFG[r.prioridade]?.label ?? r.prioridade,
      r.competenciaCritica ? 'Sim' : 'Não',
      GAP_IMPACT_CFG[r.impacto]?.label ?? r.impacto,
      formatDateNumeric(r.dataIdentificacao),
      r.planoDesenvolvimentoAssociado?.name ?? '',
      GAP_STATUS_CFG[r.estado]?.label ?? r.estado,
    ]),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          variant="underline"
          icon={Building2}
          items={[{ value: ALL, label: 'Departamento' }, ...departmentOptions]}
          value={departmentId}
          onValueChange={setDepartmentId}
          className="w-[180px]"
        />
        <Select
          variant="underline"
          icon={Briefcase}
          items={[{ value: ALL, label: 'Cargo' }, ...positionOptions]}
          value={positionId}
          onValueChange={setPositionId}
          className="w-[160px]"
        />
        <Select
          variant="underline"
          icon={Target}
          items={[{ value: ALL, label: 'Competência' }, ...competencyOptions]}
          value={competencyId}
          onValueChange={setCompetencyId}
          className="w-[180px]"
        />
        <Select
          variant="underline"
          icon={Layers}
          items={HIERARCHY_LEVEL_ITEMS}
          value={hierarchyLevel}
          onValueChange={setHierarchyLevel}
          className="w-[180px]"
        />
        <Select
          variant="underline"
          icon={Flag}
          items={PRIORITY_ITEMS}
          value={priority}
          onValueChange={setPriority}
          className="w-[150px]"
        />
        <Select
          variant="underline"
          icon={CalendarCheck}
          items={STATUS_ITEMS}
          value={status}
          onValueChange={setStatus}
          className="w-[140px]"
        />
        <UserFilterSearch
          selected={user}
          onChange={setUser}
          className="w-[240px]"
        />
        <CompetencyExportMenu
          className="ml-auto"
          build={buildExport}
          disabled={!hasFilter || !rows}
        />
      </div>

      {hasFilter && loading ? (
        <Skeleton rows={6} />
      ) : hasFilter && (!rows || rows.length === 0) ? (
        <EmptyState
          title="Sem lacunas"
          description="Nenhuma lacuna de competência corresponde aos filtros seleccionados."
        />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-brand-edge bg-brand-deep shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
          <table className="w-full min-w-[1100px] border-collapse font-body text-sm text-white">
            <thead className="bg-brand-dark">
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.label}
                    className={`px-4 py-3 text-xs font-bold uppercase leading-tight tracking-wide text-white ${c.center ? 'text-center' : 'text-left'}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(hasFilter ? (rows ?? []) : []).map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#6F8FB8]/20 transition-colors duration-150 last:border-0 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.colaboradorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          loading="lazy"
                          decoding="async"
                          src={r.colaboradorAvatarUrl}
                          alt={r.colaborador}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: avatarColor(r.colaborador),
                          }}
                        >
                          {getInitials(r.colaborador, '?')}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {r.colaborador}
                        </p>
                        <p className="truncate text-xs text-on-brand-faint">
                          {r.departamento ?? '—'} · {r.cargo ?? '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 leading-snug text-white">
                    <p>{r.competencia}</p>
                    <StatusBadge
                      value={r.categoria}
                      map={CATEGORY_CFG}
                      className="mt-0.5"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-on-brand">
                    {r.nivelAtual}
                  </td>
                  <td className="px-4 py-3 text-center text-on-brand">
                    {r.nivelEsperado}
                  </td>
                  <td className="px-4 py-3 text-center text-on-brand">
                    {r.gap}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.prioridade} map={GAP_PRIORITY_CFG} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white">
                    {r.competenciaCritica ? 'Sim' : 'Não'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.impacto} map={GAP_IMPACT_CFG} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-on-brand">
                    {formatDateNumeric(r.dataIdentificacao)}
                  </td>
                  <td className="px-4 py-3 text-xs text-on-brand">
                    {r.planoDesenvolvimentoAssociado?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.estado} map={GAP_STATUS_CFG} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
