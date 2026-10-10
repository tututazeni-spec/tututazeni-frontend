// components/competencies/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtro por categoria. Dados próprios
// + apresentação. Extraído de app/(platform)/competencies/page.tsx.
// Migrado para a fundação de design: input de pesquisa passa a Input,
// select de categoria passa a Select (Radix), skeleton local passa a
// components/ui/Skeleton, estado vazio passa a EmptyState. O cartão
// clicável usa uma div própria (role="button" + tabIndex + onKeyDown
// manual) em vez do `Card` da fundação com a prop `interactive` — bug
// conhecido (ver plano de rollout), mesmo padrão de
// components/knowledge/ArticleCard.tsx.

'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  ArrowRight,
  Boxes,
  ChessKing,
  Lightbulb,
  MessageCircleMore,
  Monitor,
  Search,
  Target,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CFG } from './constants';
import type { Competency, CompetencyCategory } from './types';

const BADGE_CLS =
  'rounded-md bg-white/20 px-2 py-0.5 font-body text-xs font-medium text-white';

// Ícone por nome (competências-tipo conhecidas); as restantes, incluindo as
// criadas dinamicamente, caem no ícone da categoria.
const NAME_ICONS: Array<[RegExp, LucideIcon]> = [
  [/resultado/i, Target],
  [/inova/i, Lightbulb],
  [/estrat/i, ChessKing],
  [/adaptab/i, Monitor],
  [/bem-estar|disciplina/i, UsersRound],
  [/comunica/i, MessageCircleMore],
];

const CATEGORY_ICONS: Record<CompetencyCategory, LucideIcon> = {
  HARD_SKILL: Monitor,
  SOFT_SKILL: UsersRound,
  LANGUAGE: MessageCircleMore,
  TOOL: Boxes,
  LEADERSHIP: ChessKing,
  FUNCTIONAL: Target,
};

function competencyIcon(comp: Competency): LucideIcon {
  const byName = NAME_ICONS.find(([re]) => re.test(comp.name));
  return byName ? byName[1] : (CATEGORY_ICONS[comp.category] ?? Target);
}

const CATEGORY_ITEMS = [
  { value: 'ALL', label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_CFG).map(([k, v]) => ({
    value: k,
    label: v.label,
  })),
];

// Só ADMIN/RH pode ver competências fora do estado ACTIVE — para os
// restantes o catálogo mostra sempre e só as activas.
const STATUS_ITEMS = [
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'INACTIVE', label: 'Arquivadas' },
  { value: 'ALL', label: 'Todas' },
];

interface CatalogViewProps {
  onSelect: (id: number) => void;
  /** ADMIN/RH: mostra o filtro de estado e a etiqueta "Arquivada" nos cartões. */
  canManage?: boolean;
}

export function CatalogView({ onSelect, canManage = false }: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [committedSearch, setCommittedSearch] = useState('');

  // A pesquisa dispara sozinha ao parar de digitar (debounce), mas a lupa e
  // o Enter também a disparam de imediato, sem esperar pelo debounce.
  useEffect(() => {
    setCommittedSearch(debouncedSearch);
  }, [debouncedSearch]);

  const runSearch = () => {
    setCommittedSearch(search);
    setPage(1);
  };

  const effectiveStatus = canManage ? statusFilter : 'ACTIVE';
  const params = {
    page,
    limit: 24,
    status: effectiveStatus === 'ALL' ? '' : effectiveStatus,
    search: committedSearch,
    category: category === 'ALL' ? '' : category,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: Competency[];
    total: number;
  }>(queryKeys.competencies.catalog(params), '/competencies', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <button
            type="button"
            onClick={runSearch}
            aria-label="Pesquisar"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
          >
            <Search size={16} strokeWidth={1.75} />
          </button>
          <Input
            type="text"
            placeholder="Pesquisar competências, tags…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            className="w-full pl-9"
          />
        </div>
        <Select
          items={CATEGORY_ITEMS}
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
        {canManage && (
          <Select
            items={STATUS_ITEMS}
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          />
        )}
        <span className="font-body text-sm text-ink-faint">
          {data?.total ?? 0} competências
        </span>
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((comp) => {
            const Icon = competencyIcon(comp);
            return (
              <div
                key={comp.id}
                onClick={() => onSelect(comp.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(comp.id);
                  }
                }}
                className="flex min-h-[168px] cursor-pointer flex-col rounded-2xl bg-gradient-to-br from-[#0B4DA2] to-[#0756B8] p-4 text-white shadow-resting transition-shadow duration-150 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B4DA2]"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <ArrowRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                </div>
                <div className="mb-2 break-words font-body text-base font-semibold leading-snug text-white">
                  {comp.name}
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className={BADGE_CLS}>
                    {CATEGORY_CFG[comp.category]?.label ?? comp.category}
                  </span>
                  {canManage && comp.status === 'IN_REVIEW' && (
                    <span className={BADGE_CLS}>Em revisão</span>
                  )}
                  {canManage && comp.status === 'INACTIVE' && (
                    <span className={BADGE_CLS}>Arquivada</span>
                  )}
                  {comp.isCritical && (
                    <span className={BADGE_CLS}>Crítica</span>
                  )}
                  {comp.isStrategic && (
                    <span className={BADGE_CLS}>Estratégica</span>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs text-white/85">
                  <span>{comp._count.courses} cursos</span>
                  <span>{comp._count.positions} cargos</span>
                </div>
              </div>
            );
          })}
          {data?.data.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title="Nenhuma competência encontrada"
                description="Ajusta a pesquisa ou a categoria seleccionada."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
