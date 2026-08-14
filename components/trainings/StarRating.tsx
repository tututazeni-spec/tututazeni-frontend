// components/trainings/StarRating.tsx
// Avaliação por estrelas (leitura) — extraído de atoms.tsx. Sem
// equivalente em components/ui/ (gap conhecido); segue o mesmo padrão
// já usado em components/instructor/DashboardView.tsx (`fill-accent
// text-accent` / `text-ink-faint`, tokens em vez de amber/gray cru).

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number | null;
}

export function StarRating({ value }: StarRatingProps) {
  if (!value)
    return (
      <span className="font-body text-xs text-ink-faint">Sem avaliação</span>
    );
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.75}
          className={
            i < Math.round(value) ? 'fill-accent text-accent' : 'text-ink-faint'
          }
        />
      ))}
      <span className="ml-0.5 font-body text-xs text-ink-muted">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
