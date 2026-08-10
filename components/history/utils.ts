// components/history/utils.ts
// Formatação de rótulo de mês ("2024-03" → "Mar 2024"). Extraído de
// app/(platform)/history/page.tsx.

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${months[+m - 1]} ${y}`;
}
