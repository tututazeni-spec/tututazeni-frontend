// components/departments/departmentOptions.ts
// Listas de escolha do formulário "Novo departamento". Os campos são texto
// livre no backend, por isso o Combobox (allowCustom) também aceita um valor
// escrito à mão.

import type { ComboboxOption } from '@/components/ui/Combobox';

const asOptions = (labels: string[]): ComboboxOption[] =>
  labels.map((label) => ({ value: label, label }));

export const FUNCTIONAL_AREA_OPTIONS = asOptions([
  'Administração e serviços gerais',
  'Comercial e vendas',
  'Compras e logística',
  'Contabilidade e finanças',
  'Direção geral',
  'Formação e desenvolvimento',
  'Gestão de pessoas',
  'Jurídico e compliance',
  'Manutenção e infraestruturas',
  'Marketing e comunicação',
  'Operações',
  'Planeamento e controlo de gestão',
  'Produção',
  'Qualidade, segurança e ambiente',
  'Relações institucionais',
  'Tecnologias de informação',
]);

export const COST_CENTER_OPTIONS = asOptions([
  'CC-100 · Administração geral',
  'CC-200 · Comercial',
  'CC-300 · Financeiro',
  'CC-400 · Recursos humanos',
  'CC-500 · Operações',
  'CC-600 · Produção',
  'CC-700 · Tecnologias de informação',
  'CC-800 · Marketing',
  'CC-900 · Formação',
]);
