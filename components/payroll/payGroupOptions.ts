// components/payroll/payGroupOptions.ts
// Grupos de pagamento (PayrollRun.payGroup é texto livre; esta lista padroniza
// o que a UI grava para os filtros por grupo baterem certo).

export const PAY_GROUP_NONE = 'NONE';
export const PAY_GROUP_ITEMS = [
  { value: PAY_GROUP_NONE, label: 'Sem grupo' },
  { value: 'Mensais', label: 'Mensais' },
  { value: 'Quinzenais', label: 'Quinzenais' },
  { value: 'Semanais', label: 'Semanais' },
  { value: 'Diaristas', label: 'Diaristas' },
  { value: 'Estagiários', label: 'Estagiários' },
  { value: 'Direcção', label: 'Direcção' },
];
