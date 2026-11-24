// components/payroll/periodOptions.ts
// Opções AAAA-MM partilhadas pelos seletores de período do payroll.

const FIRST_YEAR = 2020;
const LAST_YEAR = 2099;

/** Todos os meses (AAAA-MM) de 2020-01 a 2099-12, por ordem cronológica. */
export const PERIOD_ITEMS = Array.from(
  { length: (LAST_YEAR - FIRST_YEAR + 1) * 12 },
  (_, i) => {
    const v = `${FIRST_YEAR + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
    return { value: v, label: v };
  },
);

/** Lista completa; acrescenta o valor atual se estiver fora do intervalo. */
export function periodOptions(current: string) {
  return PERIOD_ITEMS.some((i) => i.value === current)
    ? PERIOD_ITEMS
    : [...PERIOD_ITEMS, { value: current, label: current }];
}

export const thisMonth = () => new Date().toISOString().slice(0, 7);
