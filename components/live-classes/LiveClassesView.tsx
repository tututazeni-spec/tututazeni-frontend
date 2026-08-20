// components/live-classes/LiveClassesView.tsx
// Vista apresentacional da página de aulas ao vivo: cabeçalho, stats,
// faixa de próximas sessões, separadores (Todas as Aulas/Gravações),
// pesquisa e paginação. Todos os dados/estado de UI chegam por props —
// quem os obtém/gere é o container em
// app/(platform)/live-classes/page.tsx (mesmo padrão usado em
// components/evaluation360/Evaluation360View.tsx).
//
// Extraído de page.tsx porque a página inteira (1364 linhas) estava toda
// numa única função — ver memory project_innova_component_separation_audit.

import { ClassCard } from './ClassCard';
import { RecordingCard } from './RecordingCard';
import { Spinner } from './Spinner';
import { UpcomingStrip } from './UpcomingStrip';
import { CARD, INP, tabBtn } from './utils';
import type { LiveClass } from './types';

export type MainTab = 'live' | 'recordings';

export interface Filters {
  page: number;
  courseId: string;
}

export interface LiveClassesViewProps {
  tab: MainTab;
  onTabChange: (tab: MainTab) => void;
  filters: Filters;
  onFiltersChange: (patch: Partial<Omit<Filters, 'page'>>) => void;
  onGoToPage: (delta: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  loading: boolean;
  filtered: LiveClass[];
  total: number;
  totalPages: number;
  recordings: LiveClass[];
  upcoming: LiveClass[];
  liveNow: number;
  upcomingCount: number;
  onOpen: (id: number) => void;
  onCreateNew: () => void;
  onViewRecording: (lc: LiveClass) => void;
  onDelete: (lc: LiveClass) => void;
}

export function LiveClassesView({
  tab,
  onTabChange,
  filters,
  onFiltersChange,
  onGoToPage,
  search,
  onSearchChange,
  loading,
  filtered,
  total,
  totalPages,
  recordings,
  upcoming,
  liveNow,
  upcomingCount,
  onOpen,
  onCreateNew,
  onViewRecording,
  onDelete,
}: LiveClassesViewProps) {
  const stats = [
    {
      icon: '🔴',
      label: 'Aulas ao Vivo',
      value: liveNow,
      textClass: 'text-danger',
      bgClass: 'bg-danger-subtle',
    },
    {
      icon: '📅',
      label: 'Aulas Agendadas',
      value: upcomingCount,
      textClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
    {
      icon: '🎬',
      label: 'Aulas Gravadas',
      value: recordings.length,
      textClass: 'text-accent',
      bgClass: 'bg-accent-subtle',
    },
    {
      icon: '🎥',
      label: 'Total de Aulas',
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
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="py-2.25 px-5 bg-danger text-canvas border-none rounded-lg text-sm font-bold cursor-pointer"
          >
            + Nova Aula
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-5.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${CARD} py-3.5 px-4 flex items-center gap-3`}
            >
              <div
                className={`w-10 h-10 rounded-[10px] ${s.bgClass} flex items-center justify-center text-lg flex-shrink-0`}
              >
                {s.icon}
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

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-surface-sunken rounded-lg p-1 mb-5 w-fit">
          <button
            onClick={() => onTabChange('live')}
            className={tabBtn(tab === 'live')}
          >
            Todas as Aulas
          </button>
          <button
            onClick={() => onTabChange('recordings')}
            className={tabBtn(tab === 'recordings')}
          >
            🎬 Gravações ({recordings.length})
          </button>
        </div>

        {/* ── Search ── */}
        <div className="flex gap-3 mb-4.5 flex-wrap items-center">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Pesquisar por tópico ou curso..."
            className={`${INP} min-w-65`}
          />
          {tab === 'live' && (
            <input
              value={filters.courseId}
              onChange={(e) => onFiltersChange({ courseId: e.target.value })}
              placeholder="ID do Curso"
              type="number"
              className={`${INP} w-32`}
            />
          )}
          {(search || filters.courseId) && (
            <button
              onClick={() => {
                onSearchChange('');
                onFiltersChange({ courseId: '' });
              }}
              aria-label="Limpar filtros"
              className="py-2.25 px-3.5 rounded-lg border border-border bg-white cursor-pointer text-xs text-ink-muted"
            >
              ✕
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════
            TAB: TODAS AS AULAS
        ══════════════════════════════════════ */}
        {tab === 'live' &&
          (loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div className={`${CARD} py-13 px-6 text-center`}>
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
                    onOpen={onOpen}
                    onViewRecording={onViewRecording}
                    onDelete={onDelete}
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
          ))}

        {/* ══════════════════════════════════════
            TAB: GRAVAÇÕES
        ══════════════════════════════════════ */}
        {tab === 'recordings' &&
          (filtered.length === 0 ? (
            <div className={`${CARD} py-13 px-6 text-center`}>
              <p className="text-sm font-semibold text-ink m-0 mb-1.5">
                Sem gravações disponíveis
              </p>
              <p className="text-sm text-ink-faint">
                As gravações aparecem aqui após as aulas terminarem e o URL ser
                guardado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
              {filtered.map((lc) => (
                <RecordingCard key={lc.id} lc={lc} onView={onViewRecording} />
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
