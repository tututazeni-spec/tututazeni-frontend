// components/executive-reports/kpiFormat.ts
// Formatação e semáforo dos KPIs executivos. "Sem dados" nunca é convertido
// em zero (docs/Executive_Reports.md §12.3).

import type { NavyStatTone } from '@/components/ui/NavyStatCard';
import type { ExecutiveKpi, KpiState } from './dashboardTypes';

export function formatKpiValue(
  value: number | null,
  unit: ExecutiveKpi['unit'],
): string {
  if (value === null) return 'Sem dados';
  const n = value.toLocaleString('pt-PT', { maximumFractionDigits: 1 });
  return unit === '%' ? `${n}%` : n;
}

export const STATE_LABEL: Record<KpiState, string> = {
  ON_TARGET: 'Dentro da meta',
  WARNING: 'Em alerta',
  CRITICAL: 'Crítico',
  NO_TARGET: 'Sem meta',
  NO_DATA: 'Sem dados',
};

export const STATE_TONE: Record<KpiState, NavyStatTone> = {
  ON_TARGET: 'green',
  WARNING: 'orange',
  CRITICAL: 'red',
  NO_TARGET: 'blue',
  NO_DATA: 'blue',
};

export const STATE_BADGE: Record<KpiState, string> = {
  ON_TARGET: 'bg-success-subtle text-success-ink',
  WARNING: 'bg-warning-subtle text-warning-ink',
  CRITICAL: 'bg-danger-subtle text-danger-ink',
  NO_TARGET: 'bg-info-subtle text-info-ink',
  NO_DATA: 'bg-surface-sunken text-ink-muted',
};

/** A variação é "boa" conforme a direcção do KPI (ex.: rotatividade a descer). */
export function changeIsGood(k: ExecutiveKpi): boolean | null {
  if (k.change === null || k.change === 0 || k.direction === 'NEUTRAL')
    return null;
  return k.direction === 'HIGHER_IS_BETTER' ? k.change > 0 : k.change < 0;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export const CONTRACT_LABEL: Record<string, string> = {
  INDEFINITE: 'Efectivo',
  FIXED_TERM: 'Termo certo',
  UNCERTAIN_TERM: 'Termo incerto',
  APPRENTICESHIP: 'Aprendizagem',
  INTERNSHIP: 'Estágio',
  SERVICE_PROVISION: 'Prestação de serviços',
  TEMPORARY_PLACEMENT: 'Cedência temporária',
  PART_TIME: 'Tempo parcial',
  NOT_SET: 'Não definido',
  OTHER: 'Outros',
};

// Nomes técnicos dos módulos (slug do backend) → português
const MODULE_LABEL: Record<string, string> = {
  users: 'Utilizadores',
  departments: 'Departamentos',
  organization: 'Organização',
  attendance: 'Assiduidade',
  leave: 'Licenças e ausências',
  'payroll / payslips': 'Folha salarial / recibos',
  'work-declaration': 'Declarações de trabalho',
  trainings: 'Formações',
  courses: 'Cursos',
  'course-modules': 'Módulos de curso',
  enrollments: 'Inscrições',
  assessments: 'Avaliações',
  competencies: 'Competências',
  'competency-map': 'Mapa de competências',
  performance: 'Desempenho',
  '360 feedback': 'Feedback 360°',
  'development-plans': 'Planos de desenvolvimento',
  'career-plans': 'Planos de carreira',
  'talent-development': 'Desenvolvimento de talento',
  onboarding: 'Integração de colaboradores',
  'avatar-training': 'Formação com avatar',
  leadership: 'Liderança',
  'micro-learning': 'Microaprendizagem',
  'learning-paths': 'Percursos de aprendizagem',
  knowledge: 'Conhecimento',
  'content-library': 'Biblioteca de conteúdos',
  'document-repository': 'Repositório de documentos',
  engagement: 'Envolvimento',
  succession: 'Sucessão',
  instructor: 'Formadores',
  events: 'Eventos',
  processes: 'Processos',
  automations: 'Automações',
  notifications: 'Notificações',
  history: 'Histórico',
  'API Integration': 'Integrações de API',
  auth: 'Autenticação',
  'executive-reports': 'Relatórios executivos',
};

/** Nome em português de um módulo (slug do backend); desconhecido → o próprio slug. */
export const moduleLabel = (slug: string): string => MODULE_LABEL[slug] ?? slug;
