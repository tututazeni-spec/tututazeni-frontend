// components/competencies/EvaluationsView.tsx
// Separador "Avaliações" (docs/módulo_competencies.md §6) — lista
// consolidada das avaliações de competência já gravadas (GET
// /competencies/evaluations). A avaliação em si continua integrada com os
// módulos Evaluation e Evaluation 360°; este separador apresenta o
// resultado relacionado à competência, guardado em UserCompetency. Dados
// próprios + apresentação, mesmo padrão de
// components/evaluation/EvaluationsTab.tsx.

'use client';

import { useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
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
  EVALUATION_STATUS_CFG,
  EVALUATION_TYPE_LABELS,
  POSITION_LEVEL_CFG,
} from './constants';
import {
  useCompetencyOptions,
  useDepartmentOptions,
  usePositionOptions,
  type DirectoryUser,
} from './modelFormData';
import { UserFilterSearch } from './UserFilterSearch';
import { CompetencyExportMenu } from './CompetencyExportMenu';

import type { CompetencyEvaluation } from './types';
import { getInitials, formatDateNumeric } from '@/lib/format';

const ALL = '';

const HIERARCHY_LEVEL_ITEMS = [
  { value: ALL, label: 'Nível hierárquico' },
  ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const TYPE_ITEMS = [
  { value: ALL, label: 'Tipo' },
  ...Object.entries(EVALUATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Estado' },
  ...Object.entries(EVALUATION_STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const COLUMNS = [
  { label: 'Colaborador' },
  { label: 'Avaliador' },
  { label: 'Competência' },
  { label: 'Tipo' },
  { label: 'Nível obtido', center: true },
  { label: 'Nível esperado', center: true },
  { label: 'Lacuna', center: true },
  { label: 'Data' },
  { label: 'Estado' },
  { label: 'Comentários' },
  { label: 'Evidências' },
  { label: 'Próxima avaliação' },
];

const AVATAR_COLORS = ['#22B8A7', '#9B35D5', '#FF9C2A', '#1685FF'];

export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function EvaluationsView() {
  const [departmentId, setDepartmentId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [competencyId, setCompetencyId] = useState(ALL);
  const [hierarchyLevel, setHierarchyLevel] = useState(ALL);
  const [source, setSource] = useState(ALL);
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
    source: source === ALL ? undefined : source,
    status: status === ALL ? undefined : status,
    userId: user?.id,
  };

  // Sem nenhum filtro seleccionado só se mostra o cabeçalho da tabela.
  const hasFilter = Object.values(params).some((v) => v !== undefined);

  const { data: rows, isLoading: loading } = useApiQuery<
    CompetencyEvaluation[]
  >(queryKeys.competencies.evaluations(params), '/competencies/evaluations', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    enabled: hasFilter,
  });

  const buildExport = () => ({
    title: 'Avaliações de competências',
    filename: 'avaliacoes-de-competencias',
    headers: COLUMNS.map((c) => c.label),
    rows: (rows ?? []).map((r) => [
      r.colaborador,
      r.avaliador ?? '',
      r.competencia,
      r.tipoAvaliacao,
      r.nivelObtido,
      r.nivelEsperado,
      r.gap,
      formatDateNumeric(r.data),
      EVALUATION_STATUS_CFG[r.estado]?.label ?? r.estado,
      r.comentarios,
      r.evidencias,
      r.proximaAvaliacao ? formatDateNumeric(r.proximaAvaliacao) : '',
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
          icon={ClipboardList}
          items={TYPE_ITEMS}
          value={source}
          onValueChange={setSource}
          className="w-[140px]"
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
          title="Sem avaliações"
          description="Nenhuma avaliação de competência corresponde aos filtros seleccionados."
        />
      ) : (
        <div className="scroll-navy overflow-x-auto rounded-[14px] border border-border bg-surface shadow-elevated">
          <table className="w-full min-w-[1500px] border-collapse font-body text-sm text-ink [&_td:not(:first-child)]:border-l [&_td:not(:first-child)]:border-border [&_th:not(:first-child)]:border-l [&_th:not(:first-child)]:border-[#6F8FB8]/30">
            <thead className="bg-brand-dark">
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.label}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase leading-tight tracking-wide text-white ${c.center ? 'text-center' : 'text-left'}`}
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
                  className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-sunken"
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
                        <p className="truncate font-semibold text-ink">
                          {r.colaborador}
                        </p>
                        <p className="truncate text-xs text-ink-faint">
                          {r.departamento ?? '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {r.avaliador ?? '—'}
                  </td>
                  <td className="px-4 py-3 leading-snug text-ink">
                    <p>{r.competencia}</p>
                    <StatusBadge
                      value={r.categoria}
                      map={CATEGORY_CFG}
                      className="mt-0.5"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-info-subtle px-2.5 py-0.5 text-xs font-medium text-info-ink">
                      {r.tipoAvaliacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-ink-muted">
                    {r.nivelObtido}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-muted">
                    {r.nivelEsperado ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-muted">
                    {r.gap ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {formatDateNumeric(r.data)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink">
                    {EVALUATION_STATUS_CFG[r.estado]?.label ?? r.estado}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-4 py-3 text-xs text-ink-muted"
                    title={r.comentarios ?? ''}
                  >
                    {r.comentarios ?? '—'}
                  </td>
                  <td
                    className="max-w-[180px] truncate px-4 py-3 text-xs text-ink-muted"
                    title={r.evidencias ?? ''}
                  >
                    {r.evidencias ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-faint">
                    {r.proximaAvaliacao
                      ? formatDateNumeric(r.proximaAvaliacao)
                      : '—'}
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
