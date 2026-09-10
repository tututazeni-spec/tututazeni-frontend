// components/leadership/constants.ts
// Mapas de badges e labels do módulo de liderança. Extraído de
// app/(platform)/leadership/page.tsx.
//
// Cores mapeadas para os tokens semânticos da fundação de design (Fase
// A) — mesmo padrão de components/sucession/constants.ts. CLASS_CFG usa
// variantes sólidas (bg-warning/bg-danger + text-canvas) para os
// extremos (TOP_10, CRITICAL) e subtle para os intermédios, preservando
// a gradação de intensidade que a paleta crua original comunicava.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Role } from '@/lib/roles';
import type { Competency, HealthStatus, ProgramLevel, ReadinessLevel, View } from './types';

export const LEVEL_CFG: StatusBadgeMap<ProgramLevel> = {
  INITIAL: { label: 'Inicial', cls: 'bg-success-subtle text-success-ink' },
  INTERMEDIATE: {
    label: 'Intermédio',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ADVANCED: { label: 'Avançado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const HEALTH_CFG: Record<
  HealthStatus,
  { label: string; dot: string; cls: string }
> = {
  GREEN: { label: 'Bom', dot: 'bg-success', cls: 'text-success-ink' },
  YELLOW: { label: 'Atenção', dot: 'bg-warning', cls: 'text-warning-ink' },
  RED: { label: 'Crítico', dot: 'bg-danger', cls: 'text-danger-ink' },
};

export const CLASS_CFG: StatusBadgeMap<string> = {
  TOP_10: { label: 'Top 10%', cls: 'bg-warning text-canvas' },
  ABOVE_AVERAGE: {
    label: 'Acima da média',
    cls: 'bg-success-subtle text-success-ink',
  },
  AVERAGE: { label: '= Médio', cls: 'bg-surface-sunken text-ink-muted' },
  BELOW_AVERAGE: {
    label: 'Abaixo',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  CRITICAL: { label: 'Crítico', cls: 'bg-danger text-canvas' },
};

export const COMP_LABELS: Record<Competency, string> = {
  COMMUNICATION: 'Comunicação',
  DEVELOPMENT: 'Desenvolvimento',
  RECOGNITION: 'Reconhecimento',
  AUTONOMY: 'Autonomia',
  FAIRNESS: 'Equidade',
  EXAMPLE: 'Exemplo',
  STRATEGY: 'Estratégia',
  RESILIENCE: 'Resiliência',
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'my-dashboard', label: 'O meu painel' },
  { id: 'team', label: 'A minha equipa' },
  { id: 'programs', label: 'Programas' },
  { id: 'feedback360', label: 'Feedback 360°' },
  { id: 'ranking', label: 'Classificação' },
  { id: 'kudos', label: 'Reconhecimento' },
];

export const TITLES: Record<View, string> = {
  'my-dashboard': 'Desenvolvimento de Liderança',
  team: 'A minha Equipa',
  programs: 'Programas de Liderança',
  feedback360: 'Feedback 360° de Liderança',
  ranking: 'Quadro de Indicadores de Liderança',
  kudos: 'Mural de Reconhecimento',
};

// ─── Workspace de gestão do programa (Task 7) ───────────────────────────────

// Espelha o @Roles(...PROGRAM_MANAGERS) do backend
// (src/leadership/leadership.controller.ts). A visibilidade da UI não é um
// controlo de segurança — o backend valida sempre role + ownership.
export const PROGRAM_MANAGER_ROLES: readonly Role[] = [
  'ADMIN',
  'RH',
  'GESTOR',
  'INSTRUCTOR',
  'DIRECTOR',
  'LIDER',
];

export const PARTICIPANT_STATUS_CFG: StatusBadgeMap<string> = {
  CANDIDATE: { label: 'Candidato', cls: 'bg-surface-sunken text-ink-muted' },
  INVITED: { label: 'Convidado', cls: 'bg-warning-subtle text-warning-ink' },
  SELECTED: { label: 'Selecionado', cls: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Recusado', cls: 'bg-danger-subtle text-danger-ink' },
  ENROLLED: { label: 'Inscrito', cls: 'bg-success-subtle text-success-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-warning-subtle text-warning-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success text-canvas' },
  FAILED: { label: 'Não concluiu', cls: 'bg-danger-subtle text-danger-ink' },
  WITHDRAWN: { label: 'Desistiu', cls: 'bg-surface-sunken text-ink-muted' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-muted' },
};

export const PROJECT_STATUS_CFG: StatusBadgeMap<string> = {
  PROPOSED: { label: 'Proposto', cls: 'bg-surface-sunken text-ink-muted' },
  APPROVED: { label: 'Aprovado', cls: 'bg-success-subtle text-success-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-warning-subtle text-warning-ink' },
  SUBMITTED: { label: 'Submetido', cls: 'bg-warning-subtle text-warning-ink' },
  UNDER_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success text-canvas' },
  REJECTED: { label: 'Rejeitado', cls: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-muted' },
};

export const READINESS_CFG: Record<ReadinessLevel, { label: string; cls: string }> = {
  READY_NOW: { label: 'Pronto agora', cls: 'bg-success text-canvas' },
  READY_SOON: { label: 'Pronto em breve', cls: 'bg-warning-subtle text-warning-ink' },
  NEEDS_DEVELOPMENT: { label: 'A desenvolver', cls: 'bg-danger-subtle text-danger-ink' },
};

export const ASSESSMENT_STAGE_LABELS: Record<string, string> = {
  INITIAL: 'Inicial',
  MIDPOINT: 'Intermédia',
  FINAL: 'Final',
  FOLLOW_UP: 'Seguimento',
};

export const LEVEL_ITEMS = [
  { value: 'INITIAL', label: 'Inicial' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

export const PROGRAM_TYPE_ITEMS = [
  { value: 'DEVELOPMENT', label: 'Desenvolvimento' },
  { value: 'SUCCESSION', label: 'Sucessão' },
  { value: 'HIGH_POTENTIAL', label: 'Alto potencial' },
  { value: 'ONBOARDING_LEADERSHIP', label: 'Onboarding de liderança' },
  { value: 'EXECUTIVE', label: 'Executivo' },
  { value: 'TECHNICAL_LEADERSHIP', label: 'Liderança técnica' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

export const CORPORATE_LEVEL_ITEMS = [
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'COORDINATOR', label: 'Coordenador' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'SENIOR_MANAGER', label: 'Gestor sénior' },
  { value: 'DIRECTOR', label: 'Diretor' },
  { value: 'EXECUTIVE', label: 'Executivo' },
  { value: 'C_LEVEL', label: 'C-Level' },
];

export const MODALITY_ITEMS = [
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrido' },
];

export const CRITERION_SOURCE_ITEMS = [
  { value: 'PERFORMANCE_REVIEW', label: 'Avaliação de desempenho' },
  { value: 'NINE_BOX_POTENTIAL', label: 'Potencial (9-box)' },
  { value: 'COMPETENCY_ASSESSMENT', label: 'Avaliação de competências' },
  { value: 'FEEDBACK_360', label: 'Feedback 360°' },
  { value: 'LEADERSHIP_SCORE', label: 'Leadership score' },
  { value: 'TENURE', label: 'Antiguidade' },
  { value: 'CAREER_HISTORY', label: 'Histórico de carreira' },
  { value: 'TRAINING_HISTORY', label: 'Histórico de formação' },
  { value: 'MANUAL', label: 'Manual' },
];

export const METHODOLOGY_ITEMS = [
  { value: 'TRAINING', label: 'Formação' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'COACHING', label: 'Coaching' },
  { value: 'MENTORING', label: 'Mentoria' },
  { value: 'PROJECT', label: 'Projeto' },
  { value: 'SIMULATION', label: 'Simulação' },
  { value: 'JOB_ROTATION', label: 'Rotação de funções' },
  { value: 'SHADOWING', label: 'Shadowing' },
  { value: 'SELF_STUDY', label: 'Autoestudo' },
  { value: 'PEER_LEARNING', label: 'Aprendizagem entre pares' },
  { value: 'ACTION_LEARNING', label: 'Action learning' },
  { value: 'OTHER', label: 'Outra' },
];

export const CONTENT_TYPE_ITEMS = [
  { value: 'COURSE', label: 'Curso' },
  { value: 'LEARNING_PATH', label: 'Trilha' },
  { value: 'MICRO_LEARNING', label: 'Micro-learning' },
  { value: 'ASSESSMENT', label: 'Avaliação' },
  { value: 'EXTERNAL', label: 'Externo (URL)' },
];

export const TARGETING_SCOPE_ITEMS = [
  { value: 'ROLE', label: 'Função' },
  { value: 'POSITION', label: 'Cargo' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'UNIT', label: 'Unidade' },
  { value: 'JOB_FAMILY', label: 'Família profissional' },
  { value: 'SENIORITY', label: 'Antiguidade' },
  { value: 'PERFORMANCE', label: 'Desempenho' },
  { value: 'POTENTIAL', label: 'Potencial' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

export const ADVISOR_ROLE_ITEMS = [
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'COACH', label: 'Coach' },
  { value: 'SPECIALIST', label: 'Especialista' },
  { value: 'INSTRUCTOR', label: 'Formador' },
  { value: 'SPONSOR', label: 'Sponsor' },
  { value: 'PROGRAM_MANAGER', label: 'Gestor do programa' },
];

export const ASSESSMENT_STAGE_ITEMS = [
  { value: 'INITIAL', label: 'Inicial' },
  { value: 'MIDPOINT', label: 'Intermédia' },
  { value: 'FINAL', label: 'Final' },
  { value: 'FOLLOW_UP', label: 'Seguimento' },
];

export const READINESS_ITEMS = [
  { value: 'READY_NOW', label: 'Pronto agora' },
  { value: 'READY_SOON', label: 'Pronto em breve' },
  { value: 'NEEDS_DEVELOPMENT', label: 'A desenvolver' },
];

/**
 * As 16 etapas do assistente de criação/configuração do programa (spec §
 * "Interface"). `persist` indica como cada etapa grava:
 *  - `create`  → POST /leadership/programs (etapa 1, cria em DRAFT)
 *  - `scalars` → PUT /leadership/programs/:id (campos escalares)
 *  - `config`  → PUT /leadership/programs/:id/configuration (listas)
 *  - `review`  → só leitura, sem gravação
 */
export const WIZARD_STEPS = [
  { id: 'identity', label: 'Informação', persist: 'create' },
  { id: 'classification', label: 'Classificação', persist: 'scalars' },
  { id: 'objective', label: 'Objetivo geral', persist: 'scalars' },
  { id: 'planning', label: 'Planeamento', persist: 'scalars' },
  { id: 'sessions', label: 'Sessões e modalidade', persist: 'scalars' },
  { id: 'capacity', label: 'Capacidade', persist: 'scalars' },
  { id: 'audience', label: 'Público-alvo', persist: 'config' },
  { id: 'selection', label: 'Critérios de seleção', persist: 'config' },
  { id: 'competencies', label: 'Competências', persist: 'config' },
  { id: 'objectives', label: 'Objetivos mensuráveis', persist: 'config' },
  { id: 'contents', label: 'Conteúdos da Academia', persist: 'config' },
  { id: 'methodologies', label: 'Metodologias', persist: 'config' },
  { id: 'advisors', label: 'Equipa de acompanhamento', persist: 'config' },
  { id: 'completion', label: 'Critérios de conclusão', persist: 'scalars' },
  { id: 'certification', label: 'Certificação', persist: 'scalars' },
  { id: 'review', label: 'Revisão', persist: 'review' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];
