// components/competencies/constants.ts
// Labels de nível, badge de categoria e navegação do módulo. Extraído
// de app/(platform)/competencies/page.tsx. Cores mapeadas para os
// tokens semânticos da fundação de design (Fase A).

import { NON_COLABORADOR_ROLES, type Role } from '@/lib/roles';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  CompetencyCategory,
  CompetencyEvaluationStatus,
  CompetencyGapImpact,
  CompetencyGapPriority,
  CompetencyGapStatus,
  CompetencySource,
  CompetencyStatus,
  DevelopmentActionStatus,
  DevelopmentActionType,
  DevelopmentResult,
  PositionLevel,
  SeniorityLevel,
  View,
} from './types';

export const LEVEL_LABELS = [
  '—',
  'Básico',
  'Elementar',
  'Intermédio',
  'Avançado',
  'Especialista',
];

export const CATEGORY_CFG: StatusBadgeMap<CompetencyCategory> = {
  HARD_SKILL: { label: 'Competências Técnicas', cls: 'bg-info-subtle text-info-ink' },
  SOFT_SKILL: { label: 'Competências Comportamentais', cls: 'bg-primary-subtle text-primary' },
  LANGUAGE: { label: 'Idioma', cls: 'bg-success-subtle text-success-ink' },
  TOOL: { label: 'Ferramenta', cls: 'bg-warning-subtle text-warning-ink' },
  LEADERSHIP: { label: 'Liderança', cls: 'bg-accent-subtle text-accent' },
  FUNCTIONAL: { label: 'Competências Funcionais', cls: 'bg-danger-subtle text-danger-ink' },
};

// docs/módulo_competencies.md §2 — "Estado" da competência. Usado no
// catálogo (badge) e no formulário. ACTIVE/INACTIVE já tinham rotulagem ad
// hoc inline em CatalogView.tsx; IN_REVIEW é novo (Fase 1).
export const STATUS_CFG: StatusBadgeMap<CompetencyStatus> = {
  ACTIVE: { label: 'Activa', cls: 'bg-success-subtle text-success-ink' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  INACTIVE: { label: 'Arquivada', cls: 'bg-surface-sunken text-ink-muted' },
};

// "Matriz de Competências" e "Dashboard RH" ficam escondidas de COLABORADOR
// a pedido do utilizador — espelha também o backend: GET
// /competencies/skill-matrix é @Roles(ADMIN, RH, GESTOR) e GET
// /competencies/dashboard/gaps é @Roles(ADMIN, RH) em
// competencies.controller.ts, nenhum inclui COLABORADOR.
// "Mapa de Competências" junta aqui o ex-módulo CompetencyMapModule
// (heatmap, matriz por cargo, gap organizacional) sem fundir dados —
// continua a bater no seu próprio controller /competency-map. Ver
// components/competency-map/CompetencyMapView.tsx. Sem restrição de
// roles, tal como a entrada de sidebar standalone que substitui — a
// visibilidade fina dos seus separadores internos já é feita dentro do
// próprio CompetencyMapView.
// "Visão Geral" (docs/módulo_competencies.md §1) é a nova primeira aba —
// KPIs organizacionais, mesma restrição de roles de "Dashboard RH" (o
// endpoint GET /competencies/overview é @Roles(ADMIN, RH, GESTOR)).
// "Níveis de Proficiência" e "Modelos de Competências" (docs/
// módulo_competencies.md §3/§4, Fase 2) — mesma restrição de roles das
// restantes abas de gestão (overview/matrix/dashboard): GET
// /competencies/proficiency-levels e GET /competencies/models não têm
// @Roles no backend (leitura aberta), mas a aba só interessa a quem gere o
// catálogo, por isso escondida de COLABORADOR tal como "Visão Geral".
// "Avaliações" (docs/módulo_competencies.md §6) — mesma restrição de roles
// que "Matriz de Competências": GET /competencies/evaluations é
// @Roles(ADMIN, RH, GESTOR) em competencies.controller.ts.
// "Gaps de Competências" e "Desenvolvimento" (docs/módulo_competencies.md
// §7/§8) — mesma restrição: GET /competencies/gaps e GET
// /competencies/development são @Roles(ADMIN, RH, GESTOR).
export const NAV: Array<{ id: View; label: string; roles?: readonly Role[] }> = [
  { id: 'overview', label: 'Visão Geral', roles: NON_COLABORADOR_ROLES },
  { id: 'catalog', label: 'Competências' },
  { id: 'levels', label: 'Níveis de Proficiência', roles: NON_COLABORADOR_ROLES },
  { id: 'models', label: 'Modelos de Competências', roles: NON_COLABORADOR_ROLES },
  { id: 'my-profile', label: 'O meu perfil' },
  { id: 'matrix', label: 'Matriz de Competências', roles: NON_COLABORADOR_ROLES },
  { id: 'evaluations', label: 'Avaliações', roles: NON_COLABORADOR_ROLES },
  { id: 'gaps', label: 'Gaps de Competências', roles: NON_COLABORADOR_ROLES },
  { id: 'development', label: 'Desenvolvimento', roles: NON_COLABORADOR_ROLES },
  { id: 'dashboard', label: 'Dashboard RH', roles: NON_COLABORADOR_ROLES },
  { id: 'competency-map', label: 'Mapa de Competências' },
];

export const TITLES: Record<View, string> = {
  overview: 'Visão Geral de Competências',
  catalog: 'Competências',
  levels: 'Níveis de Proficiência',
  models: 'Modelos de Competências',
  'my-profile': 'O meu Perfil de Competências',
  matrix: 'Matriz de Competências',
  evaluations: 'Avaliações de Competências',
  gaps: 'Gaps de Competências',
  development: 'Desenvolvimento',
  dashboard: 'Dashboard de Competências',
  'competency-map': 'Mapa de Competências',
};

// docs/módulo_competencies.md §3 — "Escala proposta". Só um preset para
// pré-preencher o formulário de criação de nível (ver decisão 1 em
// docs/superpowers/specs/2026-09-25-competencies-fase2-design.md) — não é
// persistido como tabela à parte.
export const PROFICIENCY_SCALE_PRESET: Array<{
  value: number;
  name: string;
  description: string;
}> = [
  { value: 1, name: 'Inicial', description: 'Conhecimento básico, aplica com supervisão directa.' },
  { value: 2, name: 'Básico', description: 'Aplica em tarefas simples, com apoio ocasional.' },
  { value: 3, name: 'Intermédio', description: 'Aplica com autonomia em situações comuns.' },
  { value: 4, name: 'Avançado', description: 'Domina a competência, resolve situações complexas.' },
  { value: 5, name: 'Especialista', description: 'Referência na organização, forma outros.' },
];

// docs/módulo_competencies.md §4 — "Nível hierárquico" do modelo, reaproveita
// o enum SeniorityLevel já existente no schema (ver decisão 6 do spec Fase 2).
export const HIERARCHY_LEVEL_CFG: StatusBadgeMap<SeniorityLevel> = {
  JUNIOR: { label: 'Júnior', cls: 'bg-success-subtle text-success-ink' },
  MID: { label: 'Pleno', cls: 'bg-info-subtle text-info-ink' },
  SENIOR: { label: 'Sénior', cls: 'bg-primary-subtle text-primary' },
  LEAD: { label: 'Lead', cls: 'bg-accent-subtle text-accent' },
  MANAGER: { label: 'Gestor', cls: 'bg-warning-subtle text-warning-ink' },
  DIRECTOR: { label: 'Director', cls: 'bg-danger-subtle text-danger-ink' },
  C_LEVEL: { label: 'C-Level', cls: 'bg-danger-subtle text-danger-ink' },
};

// docs/módulo_competencies.md §5 — filtro "Nível hierárquico" da Matriz de
// Competências, sobre Position.level (PositionLevel), distinto do
// SeniorityLevel acima usado só nos Modelos de Competências.
export const POSITION_LEVEL_CFG: StatusBadgeMap<PositionLevel> = {
  INTERN: { label: 'Estagiário', cls: 'bg-surface-sunken text-ink-muted' },
  JUNIOR: { label: 'Júnior', cls: 'bg-success-subtle text-success-ink' },
  MID: { label: 'Pleno', cls: 'bg-info-subtle text-info-ink' },
  SENIOR: { label: 'Sénior', cls: 'bg-primary-subtle text-primary' },
  LEAD: { label: 'Lead', cls: 'bg-accent-subtle text-accent' },
  MANAGER: { label: 'Gestor', cls: 'bg-warning-subtle text-warning-ink' },
  DIRECTOR: { label: 'Director', cls: 'bg-danger-subtle text-danger-ink' },
  EXECUTIVE: { label: 'Executivo', cls: 'bg-danger-subtle text-danger-ink' },
};

// docs/módulo_competencies.md §6 — "Tipo de avaliação" mapeado a partir de
// CompetencySource (origem real do registo em UserCompetency); espelha
// competencies.service.ts#EVALUATION_TYPE_LABELS no backend.
export const EVALUATION_TYPE_LABELS: Record<CompetencySource, string> = {
  MANUAL: 'Autoavaliação',
  MANAGER: 'Avaliação do gestor',
  ASSESSMENT: 'Avaliação técnica',
  COURSE: 'Avaliação de certificação',
  TRAINING: 'Avaliação de formação',
  HRIS: 'Importação HRIS',
};

export const EVALUATION_STATUS_CFG: StatusBadgeMap<CompetencyEvaluationStatus> = {
  ATINGIDO: { label: 'Atingido', cls: 'bg-success-subtle text-success-ink' },
  ABAIXO_DO_ESPERADO: { label: 'Abaixo do esperado', cls: 'bg-warning-subtle text-warning-ink' },
  SEM_META: { label: 'Sem meta definida', cls: 'bg-surface-sunken text-ink-muted' },
};

// docs/módulo_competencies.md §7 — "Prioridade"/"Estado"/"Impacto" do gap.
// Derivados no backend (competencies.service.ts#getGaps), não persistidos.
export const GAP_PRIORITY_CFG: StatusBadgeMap<CompetencyGapPriority> = {
  LOW: { label: 'Baixa', cls: 'bg-surface-sunken text-ink-muted' },
  MEDIUM: { label: 'Média', cls: 'bg-info-subtle text-info-ink' },
  HIGH: { label: 'Alta', cls: 'bg-warning-subtle text-warning-ink' },
  CRITICAL: { label: 'Crítica', cls: 'bg-danger-subtle text-danger-ink' },
};

export const GAP_STATUS_CFG: StatusBadgeMap<CompetencyGapStatus> = {
  IDENTIFICADO: { label: 'Identificado', cls: 'bg-surface-sunken text-ink-muted' },
  EM_DESENVOLVIMENTO: { label: 'Em desenvolvimento', cls: 'bg-info-subtle text-info-ink' },
  EM_ACOMPANHAMENTO: { label: 'Em acompanhamento', cls: 'bg-warning-subtle text-warning-ink' },
  RESOLVIDO: { label: 'Resolvido', cls: 'bg-success-subtle text-success-ink' },
  ENCERRADO: { label: 'Encerrado', cls: 'bg-surface-sunken text-ink-muted' },
};

export const GAP_IMPACT_CFG: StatusBadgeMap<CompetencyGapImpact> = {
  ALTO: { label: 'Alto', cls: 'bg-danger-subtle text-danger-ink' },
  MEDIO: { label: 'Médio', cls: 'bg-warning-subtle text-warning-ink' },
  BAIXO: { label: 'Baixo', cls: 'bg-surface-sunken text-ink-muted' },
};

// docs/módulo_competencies.md §8 — "Tipo de acção"/"Estado"/"Resultado" do
// desenvolvimento. Espelha ActionType/ActionStatus (DevelopmentPlanAction no
// Prisma) — enum completo, distinto do subconjunto de
// components/development-plans/constants.ts#ACTION_CFG.
export const DEV_ACTION_TYPE_CFG: StatusBadgeMap<DevelopmentActionType> = {
  COURSE: { label: 'Curso', cls: 'bg-info-subtle text-info-ink' },
  MENTORING: { label: 'Mentoria', cls: 'bg-primary-subtle text-primary' },
  COACHING: { label: 'Coaching', cls: 'bg-warning-subtle text-warning-ink' },
  READING: { label: 'Leitura/conteúdo', cls: 'bg-success-subtle text-success-ink' },
  PROJECT: { label: 'Projecto', cls: 'bg-danger-subtle text-danger-ink' },
  JOB_ROTATION: { label: 'Job rotation', cls: 'bg-accent-subtle text-accent' },
  MICROLEARNING: { label: 'Micro-aprendizagem', cls: 'bg-info-subtle text-info-ink' },
  WORKSHOP: { label: 'Workshop', cls: 'bg-success-subtle text-success-ink' },
  CERTIFICATION: { label: 'Certificação', cls: 'bg-accent-subtle text-accent' },
  SHADOWING: { label: 'Acompanhamento do gestor', cls: 'bg-primary-subtle text-primary' },
  PEER_COACHING: { label: 'Coaching entre pares', cls: 'bg-warning-subtle text-warning-ink' },
  FEEDBACK: { label: 'Feedback', cls: 'bg-info-subtle text-info-ink' },
  CONFERENCE: { label: 'Conferência', cls: 'bg-accent-subtle text-accent' },
  LEADERSHIP_EXPOSURE: { label: 'Exposição de liderança', cls: 'bg-danger-subtle text-danger-ink' },
  OTHER: { label: 'Outro', cls: 'bg-surface-sunken text-ink-muted' },
};

export const DEV_ACTION_STATUS_CFG: StatusBadgeMap<DevelopmentActionStatus> = {
  TODO: { label: 'Por iniciar', cls: 'bg-surface-sunken text-ink-muted' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluída', cls: 'bg-success-subtle text-success-ink' },
  BLOCKED: { label: 'Bloqueada', cls: 'bg-warning-subtle text-warning-ink' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-danger-subtle text-danger-ink' },
  OVERDUE: { label: 'Atrasada', cls: 'bg-danger-subtle text-danger-ink' },
};

export const DEV_RESULT_CFG: StatusBadgeMap<DevelopmentResult> = {
  MELHOROU: { label: 'Melhorou', cls: 'bg-success-subtle text-success-ink' },
  MANTEVE: { label: 'Manteve o nível', cls: 'bg-surface-sunken text-ink-muted' },
  PENDENTE: { label: 'Pendente', cls: 'bg-info-subtle text-info-ink' },
};
