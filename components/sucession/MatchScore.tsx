// components/sucession/MatchScore.tsx
// Score de compatibilidade sucessor↔cargo: barra mono (ProgressBar da
// fundação) + percentagem colorida por token semântico ao lado — a cor
// deixou de estar na barra em si (ProgressBar é mono-cor, bg-accent),
// mesmo padrão usado em AnalyticsTab/OverviewTab do engagement.
// Extraído de atoms.tsx.

'use client';

import { ProgressBar } from '@/components/ui/ProgressBar';

interface MatchScoreProps {
  score: number | null;
}

export function MatchScore({ score }: MatchScoreProps) {
  if (score === null) {
    return <span className="font-body text-xs text-ink-faint">—</span>;
  }

  const color =
    score >= 70
      ? 'text-success-ink'
      : score >= 45
        ? 'text-warning-ink'
        : 'text-danger-ink';

  return (
    <div className="flex items-center gap-2">
      <ProgressBar value={score} className="w-16" />
      <span className={`font-mono text-xs font-bold ${color}`}>{score}%</span>
    </div>
  );
}
