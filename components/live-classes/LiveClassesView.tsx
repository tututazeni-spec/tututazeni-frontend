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
  return (
    <>
      <style>{`
        @keyframes lv-spin { to { transform: rotate(360deg); } }
        @keyframes lv-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes lv-ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              🔴 Aulas ao Vivo
              {liveNow > 0 && (
                <span
                  style={{
                    padding: '3px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    background: '#fef2f2',
                    color: '#dc2626',
                    animation: 'lv-ping 1.5s ease-in-out infinite',
                  }}
                >
                  {liveNow} AO VIVO
                </span>
              )}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
              Aulas ao vivo com Jitsi Meet · {recordings.length} gravações
              disponíveis
            </p>
          </div>
          <button
            onClick={onCreateNew}
            style={{
              padding: '9px 20px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🎥 Nova Aula
          </button>
        </div>

        {/* ── Stats ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 22,
          }}
        >
          {[
            {
              icon: '🔴',
              label: 'Ao Vivo',
              value: liveNow,
              color: '#dc2626',
              bg: '#fef2f2',
            },
            {
              icon: '📅',
              label: 'Agendadas',
              value: upcomingCount,
              color: '#d97706',
              bg: '#fffbeb',
            },
            {
              icon: '🎬',
              label: 'Gravações',
              value: recordings.length,
              color: '#7c3aed',
              bg: '#f5f3ff',
            },
            {
              icon: '🎥',
              label: 'Total Aulas',
              value: total,
              color: '#0891b2',
              bg: '#ecfeff',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                ...CARD,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: s.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                {s.icon}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.7,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    color: s.color,
                  }}
                >
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upcoming strip ── */}
        <UpcomingStrip upcoming={upcoming} onOpen={onOpen} />

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#f1f5f9',
            borderRadius: 11,
            padding: 4,
            marginBottom: 20,
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => onTabChange('live')}
            style={tabBtn(tab === 'live')}
          >
            🎥 Todas as Aulas
          </button>
          <button
            onClick={() => onTabChange('recordings')}
            style={tabBtn(tab === 'recordings')}
          >
            🎬 Gravações ({recordings.length})
          </button>
        </div>

        {/* ── Search ── */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 18,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Pesquisar por tópico ou curso..."
            style={{ ...INP, minWidth: 260 }}
          />
          {tab === 'live' && (
            <input
              value={filters.courseId}
              onChange={(e) => onFiltersChange({ courseId: e.target.value })}
              placeholder="ID do Curso"
              type="number"
              style={{ ...INP, width: 130 }}
            />
          )}
          {(search || filters.courseId) && (
            <button
              onClick={() => {
                onSearchChange('');
                onFiltersChange({ courseId: '' });
              }}
              aria-label="Limpar filtros"
              style={{
                padding: '9px 14px',
                borderRadius: 9,
                border: '1px solid #e2e8f0',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12.5,
                color: '#64748b',
              }}
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
            <div style={{ ...CARD, padding: '52px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 34, margin: '0 0 10px' }}>🎥</p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1e293b',
                  margin: '0 0 6px',
                }}
              >
                Sem aulas encontradas
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                Cria a primeira sessão de formação ao vivo.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 14,
                }}
              >
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 24,
                  }}
                >
                  <button
                    onClick={() => onGoToPage(-1)}
                    disabled={filters.page === 1}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      opacity: filters.page === 1 ? 0.4 : 1,
                    }}
                  >
                    ← Anterior
                  </button>
                  <span
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      color: '#64748b',
                    }}
                  >
                    {filters.page} / {totalPages}
                  </span>
                  <button
                    onClick={() => onGoToPage(1)}
                    disabled={filters.page === totalPages}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      opacity: filters.page === totalPages ? 0.4 : 1,
                    }}
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
            <div style={{ ...CARD, padding: '52px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 34, margin: '0 0 10px' }}>🎬</p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1e293b',
                  margin: '0 0 6px',
                }}
              >
                Sem gravações disponíveis
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                As gravações aparecem aqui após as aulas terminarem e o URL ser
                guardado.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 14,
              }}
            >
              {filtered.map((lc) => (
                <RecordingCard key={lc.id} lc={lc} onView={onViewRecording} />
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
