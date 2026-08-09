// components/employees/constants.ts
// Constantes de domínio (labels/cores por enum) partilhadas pelos
// componentes de apresentação do módulo de colaboradores. Extraído
// verbatim de app/(platform)/employees/page.tsx.

import type {
  ContractType,
  EmployeeStatus,
  SeniorityLevel,
  WorkMode,
} from '@/hooks/useEmployees';

export const STATUS_CONFIG: Record<
  EmployeeStatus,
  { label: string; color: string; dot: string }
> = {
  ACTIVE: {
    label: 'Ativo',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  INACTIVE: {
    label: 'Inativo',
    color: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  },
  ON_LEAVE: {
    label: 'Afastado',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  TERMINATED: {
    label: 'Desligado',
    color: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  SUSPENDED: {
    label: 'Suspenso',
    color: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
  },
};

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  JUNIOR: 'Júnior',
  MID: 'Pleno',
  SENIOR: 'Sênior',
  LEAD: 'Líder',
  MANAGER: 'Gerente',
  DIRECTOR: 'Diretor',
  C_LEVEL: 'C-Level',
};

export const WORKMODE_LABELS: Record<WorkMode, string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ON_SITE: 'Presencial',
};

// Tipos de contrato — Lei Geral do Trabalho de Angola (Lei n.º 7/15)
export const CONTRACT_LABELS: Record<ContractType, string> = {
  INDEFINITE: 'Tempo Indeterminado',
  FIXED_TERM: 'A Prazo Certo',
  UNCERTAIN_TERM: 'A Prazo Incerto',
  APPRENTICESHIP: 'Aprendizagem',
  INTERNSHIP: 'Estágio Profissional',
  SERVICE_PROVISION: 'Prestação de Serviços',
  TEMPORARY_PLACEMENT: 'Cedência Temporária',
  PART_TIME: 'Tempo Parcial',
};

// Tooltips descritivos para o formulário — definidos no ficheiro original
// mas nunca ligados a nenhum elemento (nenhum `title=` os usava). Mantidos
// (não é código morto no sentido do Slideshow/StatCard do dashboard — tem
// valor de domínio real, é referência legal), mas por agora continuam por
// ligar; candidato natural a `title` nos <option> de contrato do
// FilterPanel/CreateEmployeeModal.
export const CONTRACT_DESCRIPTIONS: Record<ContractType, string> = {
  INDEFINITE: 'Vínculo permanente — regime geral (Art. 12.º)',
  FIXED_TERM: 'Duração máxima 3 anos, renovável 2× (Art. 13.º)',
  UNCERTAIN_TERM:
    'Obra ou serviço determinado sem data fim definida (Art. 14.º)',
  APPRENTICESHIP: 'Formação profissional + trabalho, até 25 anos (Art. 230.º)',
  INTERNSHIP: 'Inserção no mercado de trabalho — estágio profissional',
  SERVICE_PROVISION: 'Trabalhador independente / consultor externo',
  TEMPORARY_PLACEMENT: 'Cedência por empresa de trabalho temporário',
  PART_TIME: 'Jornada inferior à normal (Art. 103.º)',
};
