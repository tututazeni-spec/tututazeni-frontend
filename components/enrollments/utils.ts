// components/enrollments/utils.ts
// Contagem decrescente até ao deadline de uma matrícula e o intent de
// badge correspondente. Extraído de app/(platform)/enrollments/page.tsx
// e components/enrollments/atoms.tsx (DeadlinePill).

export function deadlineCountdown(deadline: string | null): string {
  if (!deadline) return '';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'Expirado';
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `${days} dias`;
}

/** Intent do Badge da pílula de deadline — mesma lógica de urgência da DeadlinePill original. */
export function deadlineIntent(
  deadline: string | null,
  isOverdue: boolean,
): 'danger' | 'warning' | 'neutral' {
  if (isOverdue) return 'danger';
  if (!deadline) return 'neutral';
  const countdown = deadlineCountdown(deadline);
  const urgent = ['Hoje', 'Amanhã', '2 dias', '3 dias'].some((d) =>
    countdown.includes(d.split(' ')[0]),
  );
  return urgent ? 'warning' : 'neutral';
}
