// components/users/profile/labels.ts
// Tradução para português dos valores (enums em inglês) que a API devolve e
// que os separadores do perfil mostram: estados, prioridades, tipos de
// formação, categorias e módulos. Valor desconhecido → versão legível do
// próprio valor (sem sublinhados, só a 1.ª letra em maiúscula).

const LABELS: Record<string, string> = {
  // Estados (matrícula, formação, PDI, avaliação, presença…)
  NOT_STARTED: 'Não iniciado',
  IN_PROGRESS: 'Em progresso',
  COMPLETED: 'Concluído',
  PARTIALLY_COMPLETED: 'Parcialmente concluído',
  OVERDUE: 'Atrasado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  CANCELED: 'Cancelado',
  PENDING: 'Pendente',
  PENDING_APPROVAL: 'Aguarda aprovação',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  DRAFT: 'Rascunho',
  SUBMITTED: 'Submetido',
  PUBLISHED: 'Publicado',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PAUSED: 'Em pausa',
  AT_RISK: 'Em risco',
  ARCHIVED: 'Arquivado',
  FAILED: 'Reprovado',
  WITHDRAWN: 'Desistiu',
  WAITLIST: 'Lista de espera',
  REGISTERED: 'Inscrito',
  ENROLLED: 'Inscrito',
  ATTENDED: 'Presente',
  CANDIDATE: 'Candidato',
  INVITED: 'Convidado',
  SELECTED: 'Seleccionado',
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Atrasado',
  PARTIAL: 'Parcial',
  JUSTIFIED: 'Justificado',
  REMOTE: 'Remoto',
  ON_LEAVE: 'Em licença',
  HALF_DAY_AM: 'Meio dia (manhã)',
  HALF_DAY_PM: 'Meio dia (tarde)',
  RECORDED: 'Registado',
  HOLIDAY: 'Feriado',

  // Prioridades
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',

  // Tipos de formação
  PRESENTIAL: 'Presencial',
  ONLINE: 'Online',
  HYBRID: 'Híbrida',
  VIRTUAL_ROOM: 'Sala virtual',
  ELEARNING: 'E-learning',
  WORKSHOP: 'Workshop',
  SEMINAR: 'Seminário',
  COACHING: 'Coaching',
  MENTORING: 'Mentoria',

  // Categorias de competências
  HARD_SKILL: 'Competência técnica',
  SOFT_SKILL: 'Competência comportamental',
  LANGUAGE: 'Idiomas',
  TOOL: 'Ferramentas',
  LEADERSHIP: 'Liderança',
  FUNCTIONAL: 'Funcional',
  TECHNICAL: 'Técnica',
  BEHAVIORAL: 'Comportamental',
  MANAGEMENT: 'Gestão',

  // Módulos / categorias do histórico e da actividade
  USERS: 'Utilizadores',
  PROCESSES: 'Processos',
  LEAVE: 'Férias e licenças',
  AUTOMATION: 'Automação',
  SCHEDULED: 'Agendamentos',
  PDI: 'PDI',
  PAYROLL: 'Folha de pagamento',
  EVALUATION: 'Avaliação',
  CERTIFICATION: 'Certificação',
  CERTIFICATES: 'Certificados',
  ATTENDANCE: 'Presenças',
  TRAININGS: 'Formações',
  TRAINING: 'Formação',
  ROLES: 'Funções e perfis',
  SUCCESSION: 'Sucessão',
  PERFORMANCE: 'Desempenho',
  COURSES: 'Cursos',
  COURSE: 'Curso',
  LMS: 'Formação (LMS)',
  CAREER: 'Carreira',
  COMPETENCIES: 'Competências',
  COMPETENCY: 'Competência',
  DOCUMENTS: 'Documentos',
  ONBOARDING: 'Integração',
  EVENTS: 'Eventos',
  BADGES: 'Distintivos',
  BADGE: 'Distintivo',
  GAMIFICATION: 'Gamificação',
  ENROLLMENT: 'Matrícula',
  ENROLLMENTS: 'Matrículas',
  LOGIN: 'Início de sessão',
  ACCESS: 'Acessos',
  SECURITY: 'Segurança',
  PROFILE: 'Perfil',
  HR: 'Recursos humanos',
  SYSTEM: 'Sistema',
  GENERAL: 'Geral',
  OTHER: 'Outros',
};

/** Texto legível para um valor sem tradução: «SOME_VALUE» → «Some value». */
function humanize(value: string): string {
  const text = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Traduz um estado, prioridade, tipo, categoria ou módulo para português. */
export function ptLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const key = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return (
    LABELS[key] ?? (value === value.toUpperCase() ? humanize(value) : value)
  );
}
