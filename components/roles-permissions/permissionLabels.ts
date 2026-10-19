// components/roles-permissions/permissionLabels.ts
// Rótulos PT para os subjects/acções de permissões servidos pela API (todos
// em maiúsculas). Partilhado entre a Matriz de permissões e o formulário
// "Novo utilizador". Fallback para o token original se não houver tradução.

export const RESOURCE_LABELS: Record<string, string> = {
  DASHBOARD: 'Painel',
  REPORTS: 'Relatórios',
  USERS: 'Utilizadores',
  ROLES: 'Funções e perfis',
  LMS: 'Formação (LMS)',
  PERFORMANCE: 'Desempenho',
  ENGAGEMENT: 'Envolvimento',
  TALENT: 'Talento',
  EVALUATION: 'Avaliação',
  CONTENT_LIBRARY: 'Biblioteca de Conteúdos',
  AVATAR_TRAINING: 'Treino com Avatar',
  ROI_IMPACT: 'Impacto / ROI',
  HISTORY: 'Histórico',
  PAYROLL: 'Folha de Pagamento',
  SENSITIVE_DATA: 'Dados Sensíveis',
  ACL: 'Controlo de Acessos (ACL)',
  HR: 'Recursos Humanos',
};

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criar',
  READ: 'Ver',
  VIEW: 'Ver',
  LIST: 'Listar',
  UPDATE: 'Editar',
  EDIT: 'Editar',
  DELETE: 'Eliminar',
  REMOVE: 'Eliminar',
  MANAGE: 'Gerir',
  EXPORT: 'Exportar',
  IMPORT: 'Importar',
  APPROVE: 'Aprovar',
  REJECT: 'Rejeitar',
  ASSIGN: 'Atribuir',
  UNASSIGN: 'Remover atribuição',
  DOWNLOAD: 'Descarregar',
  UPLOAD: 'Carregar',
  SUBMIT: 'Submeter',
  REVIEW: 'Rever',
  EXECUTE: 'Executar',
  ALL: 'Tudo',
};

export const translateResource = (s: string): string =>
  RESOURCE_LABELS[(s ?? '').toUpperCase()] ?? s;

export const translateAction = (a: string): string =>
  ACTION_LABELS[(a ?? '').toUpperCase()] ?? a;
