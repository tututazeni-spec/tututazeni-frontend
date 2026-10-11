// components/payslips/format.ts
// Formatação específica de payslips partilhada entre várias vistas
// (ListView, DetailView, CompareView, AnnualView) — não é genérica o
// suficiente para lib/format.ts (formata "2024-03" como "Março 2024").

export function fmtPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

// "2024-03" → "03/2024"
export function fmtPeriodNumeric(period: string): string {
  const [year, month] = period.split('-');
  return `${month.padStart(2, '0')}/${year}`;
}
