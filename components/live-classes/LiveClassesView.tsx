// components/live-classes/LiveClassesView.tsx
// Vista apresentacional do separador "Aulas": cabeçalho, stats, faixa de
// próximas sessões, pesquisa e paginação. Todos os dados/estado de UI
// chegam por props — quem os obtém/gere é o container em
// app/(platform)/live-classes/page.tsx (mesmo padrão usado em
// components/evaluation360/Evaluation360View.tsx).
//
// Extraído de page.tsx porque a página inteira (1364 linhas) estava toda
// numa única função — ver memory project_innova_component_separation_audit.
//
// O separador "Gravações" que aqui existia como sub-tab foi promovido a
// separador de topo próprio (docs/aulas-ao-vivo.md secção 9 lista-o como
// uma das 14 abas principais, não uma sub-vista de "Aulas") — ver
// RecordingsView.tsx.

import { Circle, Calendar, Clapperboard, Video } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { ClassCard } from './ClassCard';
import { Spinner } from './Spinner';
import { UpcomingStrip } from './UpcomingStrip';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { CARD, INP } from './utils';
import type { LiveClass, LiveClassStatus, LiveClassType, SessionModality } from './types';

export interface Filters {
  page: number;
  courseId: string;
  type: LiveClassType | '';
  status: LiveClassStatus | '';
  modality: SessionModality | '';
}

const TYPE_ITEMS = [
  { value: '', label: 'Todos os tipos' },
  ...(Object.keys(TYPE_CFG) as LiveClassType[]).map((t) => ({ value: t, label: TYPE_CFG[t].label })),
];
const STATUS_ITEMS = [
  { value: '', label: 'Todos os estados' },
  ...(Object.keys(STATUS_CFG) as LiveClassStatus[]).map((s) => ({ value: s, label: STATUS_CFG[s].label })),
];
const MODALITY_ITEMS = [
  { value: '', label: 'Todas as modalidades' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'HYBRID', label: 'Híbrida' },
];

export interface LiveClassesViewProps {
  filters: Filters;
  onFiltersChange: (patch: Partial<Omit<Filters, 'page'>>) => void;
  onGoToPage: (delta: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  loading: boolean;
  filtered: LiveClass[];
  total: number;
  totalPages: number;
  recordingsCount: number;
  upcoming: LiveClass[];
  liveNow: number;
  upcomingCount: number;
  canCreate: boolean;
  onOpen: (id: number) => void;
  onCreateNew: () => void;
  onViewRecording: (lc: LiveClass) => void;
  onDelete: (lc: LiveClass) => void;
  onStart: (lc: LiveClass) => void;
  onPostpone: (lc: LiveClass) => void;
  onCancel: (lc: LiveClass) => void;
  onDuplicate: (lc: LiveClass) => void;
}

export function LiveClassesView({
  filters,
  onFiltersChange,
  onGoToPage,
  search,
  onSearchChange,
  loading,
  filtered,
  total,
  totalPages,
  recordingsCount,
  upcoming,
  liveNow,
  upcomingCount,
  canCreate,
  onOpen,
  onCreateNew,
  onViewRecording,
  onDelete,
  onStart,
  onPostpone,
  onCancel,
  onDuplicate,
}: LiveClassesViewProps) {
  const stats = [
    {
      icon: Circle,
      label: 'Ao Vivo',
      value: liveNow,
      textClass: 'text-danger',
      bgClass: 'bg-danger-subtle',
    },
    {
      icon: Calendar,
      label: 'Agendadas',
      value: upcomingCount,
      textClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
    {
      icon: Clapperboard,
      label: 'Gravações',
      value: recordingsCount,
      textClass: 'text-accent',
      bgClass: 'bg-accent-subtle',
    },
    {
      icon: Video,
      label: 'Total Aulas',
      value: total,
      textClass: 'text-info',
      bgClass: 'bg-info-subtle',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes lv-spin { to { transform: rotate(360deg); } }
        @keyframes lv-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes lv-ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
          <div>
            <h1 className="m-0 text-2xl font-bold text-ink flex items-center gap-2.5">
              Aulas ao Vivo
              {liveNow > 0 && (
                <span
                  className="px-3 py-0.75 rounded-full text-xs font-black bg-danger-subtle text-danger"
                  style={{ animation: 'lv-ping 1.5s ease-in-out infinite' }}
                >
                  {liveNow} AO VIVO
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {recordingsCount} gravações disponíveis
            </p>
          </div>
          {canCreate && (
            <button
              onClick={onCreateNew}
              className="py-2.25 px-5 bg-danger text-canvas border-none rounded-lg text-sm font-bold cursor-pointer"
            >
              + Nova Aula
            </button>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-5.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${CARD} py-3.5 px-4 flex items-center gap-3`}
            >
              <div
                className={`w-10 h-10 rounded-[10px] ${s.bgClass} ${s.textClass} flex items-center justify-center flex-shrink-0`}
              >
                <s.icon size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="m-0 text-xs font-bold text-ink-faint uppercase tracking-wide">
                  {s.label}
                </p>
                <p className={`m-0 text-2xl font-black ${s.textClass}`}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upcoming strip ── */}
        <UpcomingStrip upcoming={upcoming} onOpen={onOpen} />

        {/* ── Search ── */}
        <div className="flex gap-3 mb-4.5 flex-wrap items-center">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar por tópico ou curso..."
            className={`${INP} min-w-65`}
          />
          <input
            value={filters.courseId}
            onChange={(e) => onFiltersChange({ courseId: e.target.value })}
            placeholder="ID do Curso"
            type="number"
            className={`${INP} w-32`}
          />
          <Select
            items={TYPE_ITEMS}
            value={filters.type}
            onValueChange={(v) => onFiltersChange({ type: v as Filters['type'] })}
            className="w-44"
          />
          <Select
            items={STATUS_ITEMS}
            value={filters.status}
            onValueChange={(v) => onFiltersChange({ status: v as Filters['status'] })}
            className="w-44"
          />
          <Select
            items={MODALITY_ITEMS}
            value={filters.modality}
            onValueChange={(v) => onFiltersChange({ modality: v as Filters['modality'] })}
            className="w-44"
          />
          {(search || filters.courseId || filters.type || filters.status || filters.modality) && (
            <button
              onClick={() => {
                onSearchChange('');
                onFiltersChange({ courseId: '', type: '', status: '', modality: '' });
              }}
              aria-label="Limpar filtros"
              className="py-2.25 px-3.5 rounded-lg border border-border bg-white cursor-pointer text-xs text-ink-muted"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div className={`${CARD} py-13 px-6 text-center`}>
            <p className="text-4xl m-0 mb-2.5"></p>
            <p className="text-sm font-semibold text-ink m-0 mb-1.5">
              Sem aulas encontradas
            </p>
            <p className="text-sm text-ink-faint">
              Cria a primeira sessão de formação ao vivo.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
              {filtered.map((lc) => (
                <ClassCard
                  key={lc.id}
                  lc={lc}
                  canManage={canCreate}
                  onOpen={onOpen}
                  onViewRecording={onViewRecording}
                  onDelete={onDelete}
                  onStart={onStart}
                  onPostpone={onPostpone}
                  onCancel={onCancel}
                  onDuplicate={onDuplicate}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => onGoToPage(-1)}
                  disabled={filters.page === 1}
                  className={`py-2 px-4 rounded-lg border border-border bg-white cursor-pointer text-xs ${
                    filters.page === 1 ? 'opacity-40' : ''
                  }`}
                >
                  ← Anterior
                </button>
                <span className="py-2 px-3.5 text-sm text-ink-muted">
                  {filters.page} / {totalPages}
                </span>
                <button
                  onClick={() => onGoToPage(1)}
                  disabled={filters.page === totalPages}
                  className={`py-2 px-4 rounded-lg border border-border bg-white cursor-pointer text-xs ${
                    filters.page === totalPages ? 'opacity-40' : ''
                  }`}
                >
                  Seguinte →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
