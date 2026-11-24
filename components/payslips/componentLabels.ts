// components/payslips/componentLabels.ts
// Nomes em português dos componentes salariais. Os códigos vêm do catálogo
// (em inglês, ex.: ALLOWANCE_FOOD) e não devem aparecer crus ao utilizador.

const COMPONENT_LABELS: Record<string, string> = {
  BASE_SALARY: 'Salário base',
  ALLOWANCE_FOOD: 'Subsídio de alimentação',
  ALLOWANCE_TRANSPORT: 'Subsídio de transporte',
  ALLOWANCE_VACATION: 'Subsídio de férias',
  ALLOWANCE_CHRISTMAS: 'Subsídio de Natal',
  ALLOWANCE_HOUSING: 'Subsídio de alojamento',
  OVERTIME: 'Horas extras',
  BONUS: 'Bónus',
  COMMISSION: 'Comissões',
  INSS_EMPLOYEE: 'INSS colaborador',
  INSS_EMPLOYER: 'INSS patronal',
  IRT: 'IRT',
  HEALTH_INSURANCE: 'Seguro de saúde',
  UNION_FEE: 'Quota sindical',
  ADVANCE: 'Adiantamento',
  LOAN: 'Empréstimo',
  ABSENCE_DEDUCTION: 'Desconto por faltas',
};

/** Nome em português: mapa conhecido, depois o nome do catálogo, depois o código legível. */
export function componentLabel(code: string, catalogName?: string): string {
  const known = COMPONENT_LABELS[code];
  if (known) return known;
  if (catalogName) return catalogName;
  const words = code.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
