// Proximidade de um evento/sessão — partilhada pelo calendário e pelas sessões.

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

// Cor do evento conforme a proximidade (mesma paleta dos alertas):
// fundo suave + barra lateral forte.
export const PROXIMITY_LEVELS = [
  {
    label: 'Passado',
    cls: 'bg-ink-faint text-white',
    bar: 'bg-ink-faint',
  },
  {
    label: 'Hoje / amanhã',
    cls: 'bg-danger text-white',
    bar: 'bg-danger',
  },
  {
    label: 'Até 7 dias',
    cls: 'bg-warning text-white',
    bar: 'bg-warning',
  },
  { label: 'Até 30 dias', cls: 'bg-info text-white', bar: 'bg-info' },
  {
    label: 'Mais de 30 dias',
    cls: 'bg-success text-white',
    bar: 'bg-success',
  },
] as const;

export function proximityLevel(startAt: string | Date | null | undefined) {
  if (!startAt || Number.isNaN(new Date(startAt).getTime()))
    return PROXIMITY_LEVELS[0];
  const days = Math.round(
    (startOfDay(new Date(startAt)).getTime() -
      startOfDay(new Date()).getTime()) /
      86_400_000,
  );
  if (days < 0) return PROXIMITY_LEVELS[0];
  if (days <= 1) return PROXIMITY_LEVELS[1];
  if (days <= 7) return PROXIMITY_LEVELS[2];
  if (days <= 30) return PROXIMITY_LEVELS[3];
  return PROXIMITY_LEVELS[4];
}

export function relativeLabel(
  startAt: string | Date | null | undefined,
): string {
  if (!startAt || Number.isNaN(new Date(startAt).getTime())) return '—';
  const days = Math.round(
    (startOfDay(new Date(startAt)).getTime() -
      startOfDay(new Date()).getTime()) /
      86_400_000,
  );
  if (days < 0) return 'Passado';
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `Em ${days} dias`;
}
