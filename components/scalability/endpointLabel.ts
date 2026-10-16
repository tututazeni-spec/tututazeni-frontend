// components/scalability/endpointLabel.ts
// Nome em português de um endpoint ("GET /courses/:id" → "Consultar curso").
// Só apresentação: o valor real do endpoint (usado para agrupar/filtrar) não muda.

const METHOD_VERBS: Record<string, [one: string, many: string]> = {
  GET: ['Consultar', 'Listar'],
  POST: ['Criar', 'Criar'],
  PUT: ['Atualizar', 'Atualizar'],
  PATCH: ['Atualizar', 'Atualizar'],
  DELETE: ['Remover', 'Remover'],
};

// [singular, plural]
const RESOURCES: Record<string, [string, string]> = {
  auth: ['sessão', 'sessões'],
  login: ['início de sessão', 'inícios de sessão'],
  logout: ['fim de sessão', 'fins de sessão'],
  refresh: ['sessão', 'sessões'],
  users: ['utilizador', 'utilizadores'],
  employees: ['colaborador', 'colaboradores'],
  courses: ['curso', 'cursos'],
  lessons: ['lição', 'lições'],
  modules: ['módulo', 'módulos'],
  enrollment: ['inscrição', 'inscrições'],
  enrollments: ['inscrição', 'inscrições'],
  certificates: ['certificado', 'certificados'],
  badges: ['distintivo', 'distintivos'],
  pdi: ['PDI', 'PDIs'],
  'development-plans': ['plano de desenvolvimento', 'planos de desenvolvimento'],
  attendance: ['presença', 'presenças'],
  leave: ['ausência', 'ausências'],
  notifications: ['notificação', 'notificações'],
  audit: ['registo de auditoria', 'registos de auditoria'],
  'audit-logs': ['registo de auditoria', 'registos de auditoria'],
  departments: ['departamento', 'departamentos'],
  roles: ['perfil', 'perfis'],
  permissions: ['permissão', 'permissões'],
  payslips: ['recibo de vencimento', 'recibos de vencimento'],
  events: ['evento', 'eventos'],
  trainings: ['formação', 'formações'],
  onboarding: ['integração de colaboradores', 'integrações de colaboradores'],
  evaluations: ['avaliação', 'avaliações'],
  competencies: ['competência', 'competências'],
  career: ['carreira', 'carreiras'],
  reports: ['relatório', 'relatórios'],
  analytics: ['análise', 'análises'],
  dashboard: ['painel', 'painéis'],
  settings: ['configuração', 'configurações'],
  integrations: ['integração', 'integrações'],
  automation: ['automação', 'automações'],
  scalability: ['escalabilidade', 'escalabilidade'],
  monitoring: ['monitorização', 'monitorização'],
  health: ['estado do sistema', 'estado do sistema'],
  'live-classes': ['aula ao vivo', 'aulas ao vivo'],
  'roi-impact': ['impacto e ROI', 'impacto e ROI'],
  library: ['biblioteca', 'biblioteca'],
  documents: ['documento', 'documentos'],
  me: ['perfil próprio', 'perfil próprio'],
  my: ['dados próprios', 'dados próprios'],
};

const isParam = (seg: string) =>
  seg.startsWith(':') || /^\d+$/.test(seg) || /^[0-9a-f-]{8,}$/i.test(seg);

export function endpointLabel(endpoint: string): string {
  const match = /^([A-Z]+)\s+(\S+)$/.exec(endpoint.trim());
  if (!match) return endpoint;
  const [, method, rawPath] = match;
  const verbs = METHOD_VERBS[method];
  const segments = rawPath
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .filter((s) => s !== 'api' && !/^v\d+$/.test(s));
  const names = segments.filter((s) => !isParam(s));
  if (!verbs || names.length === 0) return endpoint;

  const last = segments[segments.length - 1];
  const single = isParam(last);
  const key = names[names.length - 1];
  const res = RESOURCES[key];
  const noun = res ? res[single ? 0 : 1] : key.replace(/-/g, ' ');
  // Sub-recurso: "utilizadores › presenças"
  const parent = names.length > 1 ? RESOURCES[names[names.length - 2]] : null;
  const where = parent ? ` (${parent[1]})` : '';
  const verb = method === 'GET' ? verbs[single ? 0 : 1] : verbs[0];
  return `${verb} ${noun}${where}`;
}
