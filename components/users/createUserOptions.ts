// components/users/createUserOptions.ts
// Listas de escolha estáticas do formulário "Novo utilizador". Os campos
// correspondentes são texto livre no backend, por isso as listas servem de
// sugestão (Combobox allowCustom permite escrever outro valor).

import { COUNTRIES } from '@/lib/countries';
import type { ComboboxOption } from '@/components/ui/Combobox';

const asOptions = (labels: string[]): ComboboxOption[] =>
  labels.map((label) => ({ value: label, label }));

export const COUNTRY_OPTIONS = asOptions(COUNTRIES);

export const JOB_FUNCTION_OPTIONS = asOptions([
  'Administração',
  'Atendimento ao cliente',
  'Comercial / Vendas',
  'Compras e logística',
  'Contabilidade e finanças',
  'Direção',
  'Formação e desenvolvimento',
  'Jurídico',
  'Manutenção e operações',
  'Marketing e comunicação',
  'Produção',
  'Qualidade e segurança',
  'Recursos humanos',
  'Tecnologias de informação',
]);

export const PROFESSIONAL_CATEGORY_OPTIONS = asOptions([
  'Estagiário',
  'Auxiliar',
  'Operário',
  'Técnico',
  'Técnico superior',
  'Administrativo',
  'Especialista',
  'Coordenador',
  'Chefe de departamento',
  'Gestor',
  'Diretor',
  'Administrador',
]);

export const SYSTEM_FUNCTION_OPTIONS = asOptions([
  'Administrador do sistema',
  'Gestor de recursos humanos',
  'Gestor de formação',
  'Formador',
  'Chefia / líder de equipa',
  'Colaborador',
  'Auditor',
  'Consulta apenas',
]);

export const LEARNING_PROFILE_OPTIONS = asOptions([
  'Iniciante',
  'Intermédio',
  'Avançado',
  'Líder em formação',
  'Formador',
  'Autodidata',
]);

export const CONTENT_ACCESS_LEVEL_OPTIONS = asOptions([
  'Básico',
  'Intermédio',
  'Avançado',
  'Gestão',
  'Total',
]);

export const COST_CENTER_OPTIONS = asOptions([
  'Administração geral',
  'Comercial',
  'Financeiro',
  'Recursos humanos',
  'Operações',
  'Produção',
  'Tecnologias de informação',
  'Marketing',
  'Formação',
]);

export const WORK_SCHEDULE_OPTIONS = asOptions([
  'Tempo inteiro (08:00–17:00)',
  'Tempo inteiro (09:00–18:00)',
  'Meio período — manhã',
  'Meio período — tarde',
  'Por turnos',
  'Horário flexível',
  'Noturno',
]);
