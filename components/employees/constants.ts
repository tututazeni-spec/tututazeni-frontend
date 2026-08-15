// components/employees/constants.ts
// Constantes de domínio (labels/cores por enum) partilhadas pelos
// componentes de apresentação do módulo de colaboradores. Extraído
// verbatim de app/(platform)/employees/page.tsx. Cores mapeadas para os
// tokens semânticos da fundação de design (Fase A) — ver
// components/ui/StatusBadge.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ContractType,
  EmployeeStatus,
  SeniorityLevel,
  WorkMode,
} from '@/hooks/useEmployees';

export const STATUS_MAP: StatusBadgeMap<EmployeeStatus> = {
  ACTIVE: { label: 'Ativo', cls: 'bg-success-subtle text-success-ink' },
  INACTIVE: { label: 'Inativo', cls: 'bg-surface-sunken text-ink-muted' },
  ON_LEAVE: { label: 'Afastado', cls: 'bg-warning-subtle text-warning-ink' },
  TERMINATED: { label: 'Desligado', cls: 'bg-danger-subtle text-danger-ink' },
  SUSPENDED: { label: 'Suspenso', cls: 'bg-accent-subtle text-accent' },
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
