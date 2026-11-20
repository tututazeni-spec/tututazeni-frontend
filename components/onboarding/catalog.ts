// components/onboarding/catalog.ts
// Catálogo de sugestões do modal "Novo plano de integração" (TemplateFormModal).
// Fixo no código: serve só para acelerar o preenchimento — o utilizador pode
// sempre escrever o texto à mão. Os departamentos vêm da BD (nomes livres),
// por isso o casamento é por palavra-chave no nome (sem acentos/maiúsculas) e
// departamentos desconhecidos usam a lista genérica.

import type { ResponsibleRole, TaskCategory, TaskPhase } from './types';

export const planNameForDepartment = (departmentName: string): string =>
  `Plano de Integração da área de ${departmentName.replace(/^[—\s-]+/, '').trim()}`;

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const GENERIC_OBJECTIVES = [
  'Integrar o colaborador na cultura, missão e valores da empresa',
  'Dar a conhecer a estrutura da empresa e a equipa da área',
  'Apresentar o colaborador à equipa, aos gestores e às áreas com que vai colaborar',
  'Garantir o domínio das ferramentas e sistemas necessários ao cargo',
  'Cumprir a formação obrigatória e as políticas internas',
  'Garantir a leitura e aceitação do código de conduta e do regulamento interno',
  'Dar a conhecer as normas de saúde, higiene e segurança no trabalho',
  'Esclarecer as funções, responsabilidades e expectativas do cargo',
  'Definir metas claras para os primeiros 30, 60 e 90 dias',
  'Atribuir um mentor (buddy) para apoio no dia-a-dia',
  'Acompanhar a adaptação do colaborador com check-ins regulares',
  'Recolher o feedback do colaborador sobre o processo de integração',
  'Avaliar o desempenho e a adaptação no final do período de integração',
];

const DEPARTMENT_OBJECTIVES: Array<{
  keywords: string[];
  objectives: string[];
}> = [
  {
    keywords: ['auditoria', 'audit'],
    objectives: [
      'Conhecer o plano anual de auditoria e a metodologia aplicada',
      'Dominar as normas e o quadro regulamentar de auditoria interna',
      'Compreender o mapa de riscos e os processos críticos da empresa',
      'Aprender a documentar papéis de trabalho e evidências',
      'Dominar as técnicas de amostragem e de testes de controlo',
      'Aprender a planear uma auditoria: âmbito, objectivos e programa de trabalho',
      'Conhecer as ferramentas de análise de dados e de auditoria assistida por computador',
      'Perceber o circuito de reporte de constatações e recomendações',
      'Aprender a redigir relatórios de auditoria claros e objectivos',
      'Compreender o acompanhamento das acções correctivas (follow-up)',
      'Compreender os requisitos de independência, ética e confidencialidade',
      'Conhecer a relação com auditores externos e com o comité de auditoria',
      'Participar, acompanhado, numa auditoria real',
    ],
  },
  {
    keywords: ['recursos humanos', 'rh', 'pessoas', 'capital humano'],
    objectives: [
      'Conhecer os processos de recrutamento, selecção e admissão',
      'Dominar o processo de saída, rescisão e entrevista de saída',
      'Dominar o processamento salarial e a gestão de assiduidade',
      'Compreender a gestão de férias, licenças e ausências',
      'Compreender a legislação laboral e as políticas internas',
      'Aprender a usar o sistema de gestão de colaboradores',
      'Conhecer o ciclo de avaliação de desempenho',
      'Conhecer o plano de formação e o desenvolvimento de carreiras',
      'Conhecer o processo de integração (onboarding) dos novos colaboradores',
      'Compreender a política de benefícios e de remuneração',
      'Aprender a gerir processos disciplinares e a comunicação interna',
      'Garantir a confidencialidade e a protecção dos dados pessoais dos colaboradores',
    ],
  },
  {
    keywords: ['financ', 'contabil', 'tesouraria', 'controlo de gestao'],
    objectives: [
      'Conhecer o plano de contas e o ciclo de fecho mensal',
      'Dominar os processos de contas a pagar e a receber',
      'Compreender a política de tesouraria e os níveis de aprovação',
      'Aprender a fazer conciliações bancárias',
      'Aprender a elaborar o orçamento e a acompanhar os desvios',
      'Conhecer o processo de facturação e de cobranças',
      'Aprender a usar o sistema financeiro e de reporte',
      'Conhecer as obrigações fiscais e os prazos regulamentares',
      'Compreender a gestão de activos fixos e de inventários',
      'Conhecer os relatórios financeiros e os indicadores de gestão',
      'Compreender os controlos internos e a segregação de funções',
      'Apoiar, acompanhado, o fecho de um mês contabilístico',
    ],
  },
  {
    keywords: [
      'ti',
      'tecnologia',
      'informatica',
      'sistemas',
      'it',
      'desenvolvimento',
    ],
    objectives: [
      'Conhecer a arquitectura e o inventário de sistemas da empresa',
      'Dominar as políticas de segurança da informação e de acessos',
      'Configurar o ambiente de trabalho e as ferramentas da equipa',
      'Conhecer o repositório de código, o fluxo de revisão e as boas práticas',
      'Compreender o processo de suporte, incidentes e mudanças',
      'Conhecer os procedimentos de cópias de segurança e recuperação',
      'Compreender o plano de continuidade de negócio e de contingência',
      'Conhecer as ferramentas de monitorização e de gestão de redes',
      'Aprender a gerir contas, perfis e permissões de utilizadores',
      'Conhecer a documentação técnica e a base de conhecimento',
      'Compreender a gestão de fornecedores e de licenças de software',
      'Participar no primeiro projecto ou ticket acompanhado',
    ],
  },
  {
    keywords: ['comercial', 'vendas', 'negocio', 'clientes'],
    objectives: [
      'Conhecer o portefólio de produtos e serviços',
      'Dominar o processo comercial e o uso do CRM',
      'Conhecer o perfil dos clientes e as principais contas',
      'Compreender a política de preços, descontos e condições de pagamento',
      'Compreender as metas, comissões e incentivos',
      'Aprender a preparar propostas comerciais e a negociar',
      'Conhecer o mercado, a concorrência e o posicionamento da empresa',
      'Aprender a gerir o pipeline e a previsão de vendas',
      'Conhecer o processo de pós-venda e de gestão de reclamações',
      'Acompanhar reuniões com clientes antes de conduzir as próprias',
      'Conhecer o circuito de contratos, facturação e cobrança',
    ],
  },
  {
    keywords: ['marketing', 'comunicacao', 'imagem'],
    objectives: [
      'Conhecer a marca, o tom de comunicação e as regras de identidade visual',
      'Dominar as ferramentas de criação, publicação e métricas',
      'Compreender o calendário de campanhas e os públicos-alvo',
      'Conhecer o circuito de aprovação de conteúdos',
      'Conhecer a estratégia de redes sociais e de comunicação digital',
      'Aprender a medir resultados e a elaborar relatórios de campanhas',
      'Conhecer o orçamento de marketing e os fornecedores de agência',
      'Compreender a comunicação interna e a gestão de crises',
      'Conhecer o arquivo de materiais e de activos de marca',
    ],
  },
  {
    keywords: ['juridic', 'legal', 'conformidade', 'compliance'],
    objectives: [
      'Conhecer o quadro legal e regulamentar aplicável à empresa',
      'Dominar o circuito de revisão e aprovação de contratos',
      'Compreender a política de conformidade e de protecção de dados',
      'Aprender a gerir processos e prazos judiciais',
      'Conhecer o registo de contratos e de procurações',
      'Compreender a prevenção do branqueamento de capitais e da corrupção',
      'Conhecer o canal de denúncias e o tratamento de reclamações',
      'Aprender a elaborar pareceres e comunicações jurídicas',
      'Acompanhar a relação com advogados e entidades externas',
    ],
  },
  {
    keywords: ['operac', 'logistic', 'producao', 'armazem', 'manutencao'],
    objectives: [
      'Conhecer os processos operacionais e os indicadores da área',
      'Cumprir as normas de saúde, higiene e segurança no trabalho',
      'Dominar os procedimentos e equipamentos do posto de trabalho',
      'Compreender a cadeia de abastecimento e os principais fornecedores',
      'Conhecer a gestão de stocks e de armazém',
      'Aprender a registar ocorrências e a reportar incidentes',
      'Compreender o plano de manutenção preventiva e correctiva',
      'Conhecer os planos de emergência e de evacuação',
      'Conhecer as metas de produtividade e de qualidade do turno',
    ],
  },
  {
    keywords: ['compras', 'aprovisionamento', 'suprimentos'],
    objectives: [
      'Conhecer a política de compras e os limites de aprovação',
      'Dominar o processo de cotação, adjudicação e contratação',
      'Conhecer os fornecedores estratégicos e a sua avaliação',
      'Aprender a negociar prazos, preços e condições de fornecimento',
      'Compreender o circuito de requisição, encomenda e recepção',
      'Conhecer a gestão de contratos e a renovação de fornecedores',
      'Aprender a usar o sistema de compras e de gestão de stocks',
    ],
  },
  {
    keywords: ['qualidade', 'processos'],
    objectives: [
      'Conhecer o sistema de gestão da qualidade e as certificações',
      'Dominar o mapeamento e a melhoria de processos',
      'Compreender o ciclo de auditorias internas e acções correctivas',
      'Conhecer os indicadores de qualidade e o seu acompanhamento',
      'Aprender a gerir não conformidades e acções de melhoria',
      'Conhecer o controlo de documentos e de registos',
      'Compreender a medição da satisfação de clientes',
    ],
  },
  {
    keywords: ['formacao', 'academia', 'desenvolvimento de pessoas'],
    objectives: [
      'Conhecer o plano de formação e o catálogo de cursos',
      'Dominar a plataforma de aprendizagem e o acompanhamento de turmas',
      'Compreender a avaliação de eficácia da formação',
      'Aprender a levantar necessidades de formação por área',
      'Conhecer a gestão de formadores e de certificados',
      'Aprender a medir indicadores de participação e conclusão',
    ],
  },
];

/** Sugestões de objectivos do plano para o departamento (genéricas se desconhecido). */
export function objectivesForDepartment(
  departmentName: string | null,
): string[] {
  if (!departmentName) return GENERIC_OBJECTIVES;
  const n = normalize(departmentName);
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  const hit = DEPARTMENT_OBJECTIVES.find((d) =>
    d.keywords.some((k) => (k.length <= 3 ? words.includes(k) : n.includes(k))),
  );
  return hit ? hit.objectives : GENERIC_OBJECTIVES;
}

export interface ItemSuggestion {
  title: string;
  category: TaskCategory;
  phase: TaskPhase;
  responsible: ResponsibleRole;
  /** Prazo sugerido, em dias desde o início do plano. */
  dueDay: number;
}

const s = (
  category: TaskCategory,
  phase: TaskPhase,
  responsible: ResponsibleRole,
  dueDay: number,
  title: string,
): ItemSuggestion => ({ title, category, phase, responsible, dueDay });

export const ITEM_SUGGESTIONS: ItemSuggestion[] = [
  s('DOCUMENTS', 'PRE_BOARDING', 'SELF', 0, 'Entregar documentos de admissão'),
  s(
    'DOCUMENTS',
    'PRE_BOARDING',
    'HR',
    0,
    'Validar documentos de identificação e NIF',
  ),
  s('DOCUMENTS', 'DAY_1', 'SELF', 1, 'Assinar o contrato de trabalho'),
  s(
    'DOCUMENTS',
    'DAY_1',
    'HR',
    1,
    'Registar o colaborador na segurança social',
  ),
  s(
    'DOCUMENTS',
    'WEEK_1',
    'SELF',
    7,
    'Entregar dados bancários (NIB) para pagamento',
  ),
  s('IT_ACCESS', 'PRE_BOARDING', 'IT', 0, 'Criar conta de e-mail e utilizador'),
  s(
    'IT_ACCESS',
    'DAY_1',
    'IT',
    1,
    'Entregar computador e equipamento de trabalho',
  ),
  s('IT_ACCESS', 'DAY_1', 'IT', 1, 'Atribuir acessos aos sistemas da área'),
  s('IT_ACCESS', 'WEEK_1', 'SELF', 3, 'Configurar autenticação em dois passos'),
  s(
    'IT_ACCESS',
    'WEEK_1',
    'MANAGER',
    5,
    'Aprovar os acessos adicionais necessários ao cargo',
  ),
  s(
    'TRAINING',
    'DAY_1',
    'SELF',
    3,
    'Concluir o curso de boas-vindas à empresa',
  ),
  s(
    'TRAINING',
    'WEEK_1',
    'SELF',
    7,
    'Concluir a formação de segurança da informação',
  ),
  s(
    'TRAINING',
    'WEEK_1',
    'SELF',
    7,
    'Concluir a formação de saúde e segurança no trabalho',
  ),
  s('TRAINING', 'DAY_30', 'SELF', 30, 'Concluir a formação específica da área'),
  s('SOCIAL', 'DAY_1', 'MANAGER', 1, 'Apresentar o colaborador à equipa'),
  s('SOCIAL', 'DAY_1', 'BUDDY', 1, 'Visita guiada às instalações'),
  s('SOCIAL', 'WEEK_1', 'BUDDY', 5, 'Almoço de boas-vindas com a equipa'),
  s(
    'BENEFITS',
    'WEEK_1',
    'HR',
    7,
    'Apresentar os benefícios e o seguro de saúde',
  ),
  s('ADMIN', 'DAY_1', 'SELF', 1, 'Preencher o perfil na plataforma'),
  s(
    'ADMIN',
    'WEEK_1',
    'MANAGER',
    7,
    'Definir objectivos dos primeiros 90 dias',
  ),
  s('ADMIN', 'DAY_30', 'SELF', 30, 'Submeter o relatório de adaptação'),
  s('MEETING', 'DAY_1', 'MANAGER', 1, 'Reunião de boas-vindas com a direcção'),
  s('MEETING', 'WEEK_1', 'MANAGER', 5, 'Reunião de alinhamento com a equipa'),
  s(
    'MEETING',
    'DAY_30',
    'HR',
    30,
    'Reunião de balanço do primeiro mês com o RH',
  ),
  s('POLICIES', 'DAY_1', 'SELF', 3, 'Ler e aceitar o código de conduta'),
  s(
    'POLICIES',
    'WEEK_1',
    'SELF',
    7,
    'Ler e aceitar a política de privacidade e protecção de dados',
  ),
  s(
    'POLICIES',
    'WEEK_1',
    'SELF',
    7,
    'Ler o regulamento interno e as políticas de segurança',
  ),
  s(
    'EVALUATION',
    'DAY_30',
    'MANAGER',
    30,
    'Avaliação de desempenho do primeiro mês',
  ),
  s(
    'EVALUATION',
    'FOLLOW_UP',
    'MANAGER',
    60,
    'Avaliação intercalar aos 60 dias',
  ),
  s(
    'EVALUATION',
    'CONCLUSION',
    'MANAGER',
    90,
    'Avaliação final do período de integração',
  ),
  s('ONE_ON_ONE', 'WEEK_1', 'MANAGER', 5, 'Primeira reunião 1:1 com o gestor'),
  s(
    'ONE_ON_ONE',
    'DAY_30',
    'BUDDY',
    30,
    'Reunião 1:1 de acompanhamento com o mentor',
  ),
  s(
    'ONE_ON_ONE',
    'FOLLOW_UP',
    'MANAGER',
    60,
    'Reunião 1:1 de feedback aos 60 dias',
  ),
];

export interface ItemFilters {
  category?: TaskCategory | '';
  phase?: TaskPhase | '';
  responsible?: ResponsibleRole | '';
  /** Prazo máximo (dias); '' = qualquer. */
  maxDay?: string;
}

/**
 * Sugestões para os filtros escolhidos. Cada filtro estreita a lista; um
 * filtro que não deixaria nada é ignorado (para a lista nunca ficar vazia
 * sem necessidade) — o utilizador pode sempre escrever o item à mão.
 */
export function suggestionsForFilters(f: ItemFilters): ItemSuggestion[] {
  let list = ITEM_SUGGESTIONS;
  const steps: Array<(i: ItemSuggestion) => boolean> = [];
  if (f.category) steps.push((i) => i.category === f.category);
  if (f.phase) steps.push((i) => i.phase === f.phase);
  if (f.responsible) steps.push((i) => i.responsible === f.responsible);
  if (f.maxDay !== undefined && f.maxDay.trim() !== '') {
    const max = Number(f.maxDay);
    if (Number.isFinite(max)) steps.push((i) => i.dueDay <= max);
  }
  for (const step of steps) {
    const next = list.filter(step);
    if (next.length > 0) list = next;
  }
  return list;
}
