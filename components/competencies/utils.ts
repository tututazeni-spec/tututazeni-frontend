// components/competencies/utils.ts
// Mapeamento de nível de competência para cor (matriz/texto). Extraído
// de app/(platform)/competencies/page.tsx. Cores mapeadas para os
// tokens semânticos da fundação de design (Fase A). `levelBarColor`
// foi eliminado — a barra de progresso da fundação (`ProgressBar`) é
// mono-cor (`bg-accent`); o nível deixou de recolorir a barra e passa
// a comunicar-se pelo texto adjacente via `levelTextClass` (mesmo
// padrão de `scoreTextClass` em `components/engagement/AnalyticsTab.tsx`).

export function levelColor(level: number, max = 5): string {
  const pct = level / max;
  if (pct === 0) return 'bg-surface-sunken text-ink-faint';
  if (pct <= 0.25) return 'bg-danger-subtle text-danger-ink';
  if (pct <= 0.5) return 'bg-warning-subtle text-warning-ink';
  if (pct <= 0.75) return 'bg-info-subtle text-info-ink';
  return 'bg-success-subtle text-success-ink';
}

export function levelTextClass(level: number): string {
  if (level === 0) return 'text-ink-faint';
  if (level === 1) return 'text-danger';
  if (level === 2) return 'text-warning';
  if (level === 3) return 'text-info';
  return 'text-success';
}
