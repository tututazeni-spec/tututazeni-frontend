// components/enrollments/utils.ts
// Contagem decrescente até ao deadline de uma matrícula. Extraído de
// app/(platform)/enrollments/page.tsx.

export function deadlineCountdown(deadline: string | null): string {
  if (!deadline) return '';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'Expirado';
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `${days} dias`;
}
