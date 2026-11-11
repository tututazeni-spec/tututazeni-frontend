// components/departments/positionCatalog.ts
// Catálogo de sugestões do modal "Novo cargo": famílias profissionais e, para
// cada função, o conjunto de responsabilidades e requisitos específicos dela.
// São apenas sugestões — o utilizador pode escolher várias e acrescentar as
// suas à mão.

export interface JobFunctionTemplate {
  name: string;
  /** Família profissional habitual desta função (pré-preenche o campo). */
  family: string;
  responsibilities: string[];
  requirements: string[];
}

export const JOB_FAMILIES: string[] = [
  'Recursos Humanos',
  'Formação e Desenvolvimento',
  'Finanças e Contabilidade',
  'Tecnologias de Informação',
  'Comercial e Vendas',
  'Marketing e Comunicação',
  'Operações e Logística',
  'Jurídico e Compliance',
  'Auditoria e Controlo Interno',
  'Administrativo',
  'Produção',
  'Responsabilidade Social',
];

export const JOB_FUNCTIONS: JobFunctionTemplate[] = [
  {
    name: 'Gestão administrativa de pessoal',
    family: 'Recursos Humanos',
    responsibilities: [
      'Manter actualizados os processos individuais dos colaboradores',
      'Controlar assiduidade, férias e licenças',
      'Preparar contratos, adendas e declarações',
      'Tratar admissões, transferências e cessações',
      'Apoiar o processamento salarial com os dados de assiduidade',
      'Esclarecer dúvidas dos colaboradores sobre direitos e deveres',
    ],
    requirements: [
      'Licenciatura em Gestão de Recursos Humanos, Gestão ou área afim',
      'Conhecimento da legislação laboral angolana',
      'Domínio de Excel e de sistemas de gestão de RH',
      'Rigor, confidencialidade e capacidade de organização',
    ],
  },
  {
    name: 'Recrutamento e selecção',
    family: 'Recursos Humanos',
    responsibilities: [
      'Definir o perfil das vagas com os gestores requisitantes',
      'Divulgar vagas e pesquisar candidatos',
      'Triar currículos e conduzir entrevistas',
      'Aplicar testes e avaliações de competências',
      'Elaborar propostas e acompanhar a integração inicial',
      'Reportar indicadores de recrutamento (tempo de preenchimento, custo)',
    ],
    requirements: [
      'Licenciatura em Psicologia, Gestão de RH ou área afim',
      'Experiência em recrutamento e entrevistas por competências',
      'Boa comunicação e capacidade de negociação',
      'Conhecimento de plataformas de recrutamento',
    ],
  },
  {
    name: 'Formação e desenvolvimento',
    family: 'Formação e Desenvolvimento',
    responsibilities: [
      'Levantar necessidades de formação por departamento',
      'Elaborar e acompanhar o plano anual de formação',
      'Organizar sessões, formadores e logística das acções',
      'Avaliar a eficácia das formações e o retorno obtido',
      'Gerir cursos e percursos na plataforma de aprendizagem',
      'Emitir certificados e manter o registo de formações',
    ],
    requirements: [
      'Licenciatura em Educação, Psicologia, Gestão de RH ou área afim',
      'Experiência em desenho e coordenação de formação',
      'Conhecimento de plataformas de e-learning',
      'Capacidade de planeamento e comunicação',
    ],
  },
  {
    name: 'Processamento salarial e benefícios',
    family: 'Recursos Humanos',
    responsibilities: [
      'Processar mensalmente salários, subsídios e descontos',
      'Calcular IRT e contribuições para a Segurança Social',
      'Emitir recibos de vencimento e mapas legais',
      'Gerir benefícios e prémios atribuídos aos colaboradores',
      'Conciliar a folha salarial com a contabilidade',
    ],
    requirements: [
      'Formação em Contabilidade, Gestão ou área afim',
      'Domínio da legislação fiscal e laboral aplicável',
      'Experiência com software de processamento salarial',
      'Rigor numérico e sigilo profissional',
    ],
  },
  {
    name: 'Contabilidade e tesouraria',
    family: 'Finanças e Contabilidade',
    responsibilities: [
      'Registar e classificar os movimentos contabilísticos',
      'Efectuar reconciliações bancárias e conciliações de contas',
      'Preparar o fecho mensal e anual',
      'Controlar contas a pagar e a receber',
      'Cumprir as obrigações fiscais e declarativas',
      'Gerir os fluxos de caixa e pagamentos',
    ],
    requirements: [
      'Licenciatura em Contabilidade, Finanças ou área afim',
      'Conhecimento do Plano Geral de Contabilidade e da legislação fiscal',
      'Experiência com software contabilístico (ERP)',
      'Rigor, integridade e atenção ao detalhe',
    ],
  },
  {
    name: 'Controlo orçamental e financeiro',
    family: 'Finanças e Contabilidade',
    responsibilities: [
      'Elaborar e acompanhar o orçamento anual',
      'Analisar desvios entre o previsto e o realizado',
      'Produzir relatórios de gestão e indicadores financeiros',
      'Apoiar a decisão da direcção com análises de custo',
      'Controlar centros de custo e projectos',
    ],
    requirements: [
      'Licenciatura em Finanças, Economia, Gestão ou área afim',
      'Domínio avançado de Excel e ferramentas de análise',
      'Experiência em controlo de gestão',
      'Capacidade analítica e de comunicação de resultados',
    ],
  },
  {
    name: 'Desenvolvimento de software',
    family: 'Tecnologias de Informação',
    responsibilities: [
      'Desenvolver e manter funcionalidades das aplicações',
      'Rever código e garantir boas práticas de qualidade',
      'Escrever e manter testes automáticos',
      'Analisar requisitos com as áreas de negócio',
      'Corrigir falhas e melhorar o desempenho',
      'Documentar soluções e decisões técnicas',
    ],
    requirements: [
      'Licenciatura em Engenharia Informática ou área afim',
      'Experiência com TypeScript/JavaScript e bases de dados relacionais',
      'Conhecimento de controlo de versões (Git) e integração contínua',
      'Capacidade de trabalho em equipa e resolução de problemas',
    ],
  },
  {
    name: 'Suporte técnico e infraestrutura',
    family: 'Tecnologias de Informação',
    responsibilities: [
      'Prestar apoio técnico de 1.ª e 2.ª linha aos utilizadores',
      'Instalar e manter postos de trabalho e equipamentos',
      'Administrar redes, servidores e cópias de segurança',
      'Gerir contas e permissões de acesso',
      'Registar e resolver incidentes dentro dos prazos acordados',
    ],
    requirements: [
      'Formação em Informática, Redes ou área afim',
      'Conhecimento de Windows, redes e segurança básica',
      'Experiência em suporte a utilizadores',
      'Paciência, clareza na comunicação e orientação ao serviço',
    ],
  },
  {
    name: 'Vendas e relação com clientes',
    family: 'Comercial e Vendas',
    responsibilities: [
      'Prospectar e qualificar novos clientes',
      'Apresentar propostas e negociar condições comerciais',
      'Acompanhar o ciclo de venda até ao fecho',
      'Manter a carteira de clientes e o seu histórico no CRM',
      'Atingir as metas mensais de vendas',
      'Recolher feedback e apoiar a fidelização',
    ],
    requirements: [
      'Formação em Gestão, Marketing ou área afim',
      'Experiência comprovada em vendas ou relação com clientes',
      'Capacidade de negociação e orientação para resultados',
      'Conhecimento de ferramentas de CRM',
    ],
  },
  {
    name: 'Marketing e comunicação',
    family: 'Marketing e Comunicação',
    responsibilities: [
      'Planear e executar campanhas de marketing',
      'Gerir os canais digitais e as redes sociais',
      'Produzir conteúdos e materiais de comunicação',
      'Zelar pela consistência da marca',
      'Medir resultados e reportar indicadores de campanha',
    ],
    requirements: [
      'Licenciatura em Marketing, Comunicação ou área afim',
      'Experiência em marketing digital e criação de conteúdos',
      'Bom domínio da escrita em português',
      'Criatividade e capacidade analítica',
    ],
  },
  {
    name: 'Gestão de operações',
    family: 'Operações e Logística',
    responsibilities: [
      'Planear e coordenar as actividades operacionais diárias',
      'Definir e melhorar processos e procedimentos',
      'Acompanhar indicadores de desempenho operacional',
      'Gerir equipas, escalas e recursos',
      'Garantir o cumprimento de prazos, qualidade e segurança',
    ],
    requirements: [
      'Licenciatura em Gestão, Engenharia ou área afim',
      'Experiência em coordenação de equipas operacionais',
      'Conhecimento de melhoria contínua de processos',
      'Liderança e capacidade de decisão',
    ],
  },
  {
    name: 'Logística e gestão de stocks',
    family: 'Operações e Logística',
    responsibilities: [
      'Controlar entradas, saídas e inventário de armazém',
      'Planear reposições e evitar rupturas de stock',
      'Coordenar transporte e distribuição',
      'Gerir fornecedores e prazos de entrega',
      'Garantir a conformidade e a conservação dos artigos',
    ],
    requirements: [
      'Formação em Logística, Gestão ou área afim',
      'Experiência em gestão de armazém e inventários',
      'Domínio de sistemas de gestão de stocks',
      'Organização e capacidade de planeamento',
    ],
  },
  {
    name: 'Assessoria jurídica e conformidade',
    family: 'Jurídico e Compliance',
    responsibilities: [
      'Analisar e redigir contratos e minutas',
      'Emitir pareceres jurídicos internos',
      'Acompanhar processos e contencioso',
      'Monitorizar o cumprimento da legislação aplicável',
      'Apoiar políticas de protecção de dados e integridade',
    ],
    requirements: [
      'Licenciatura em Direito e inscrição na Ordem dos Advogados',
      'Experiência em direito laboral e comercial',
      'Conhecimento da legislação sobre protecção de dados',
      'Capacidade de análise, rigor e discrição',
    ],
  },
  {
    name: 'Auditoria interna',
    family: 'Auditoria e Controlo Interno',
    responsibilities: [
      'Planear e executar o plano anual de auditoria',
      'Avaliar controlos internos e gestão de risco',
      'Identificar desvios e recomendar acções correctivas',
      'Elaborar relatórios de auditoria para a administração',
      'Acompanhar a implementação das recomendações',
    ],
    requirements: [
      'Licenciatura em Contabilidade, Auditoria, Finanças ou área afim',
      'Experiência em auditoria interna ou externa',
      'Conhecimento de normas de auditoria e controlo interno',
      'Independência, rigor e espírito crítico',
    ],
  },
  {
    name: 'Gestão administrativa e secretariado',
    family: 'Administrativo',
    responsibilities: [
      'Gerir agenda, correspondência e arquivo',
      'Preparar reuniões, actas e documentação',
      'Atender chamadas e visitantes',
      'Controlar o material de escritório e os serviços gerais',
      'Apoiar a direcção em tarefas administrativas',
    ],
    requirements: [
      'Formação em Secretariado, Administração ou área afim',
      'Domínio de Office e de ferramentas de comunicação',
      'Boa expressão escrita e oral',
      'Organização, discrição e proactividade',
    ],
  },
  {
    name: 'Supervisão de produção',
    family: 'Produção',
    responsibilities: [
      'Coordenar a equipa e o plano diário de produção',
      'Garantir o cumprimento das metas de quantidade e qualidade',
      'Fazer cumprir as normas de segurança e higiene',
      'Controlar o consumo de matérias-primas e desperdícios',
      'Registar ocorrências e propor melhorias',
    ],
    requirements: [
      'Formação técnica ou superior em Engenharia/Produção',
      'Experiência em ambientes de produção',
      'Conhecimento de normas de segurança no trabalho',
      'Liderança e capacidade de resolução de problemas',
    ],
  },
  {
    name: 'Projectos de responsabilidade social',
    family: 'Responsabilidade Social',
    responsibilities: [
      'Planear e executar iniciativas de responsabilidade social',
      'Gerir parcerias com instituições e beneficiários',
      'Acompanhar orçamento e prestação de contas dos projectos',
      'Medir o impacto social das iniciativas',
      'Comunicar resultados internamente e ao exterior',
    ],
    requirements: [
      'Formação em Ciências Sociais, Gestão ou área afim',
      'Experiência em gestão de projectos sociais',
      'Capacidade de relacionamento com parceiros',
      'Sensibilidade social e capacidade de organização',
    ],
  },
];

export const JOB_FUNCTION_NAMES = JOB_FUNCTIONS.map((f) => f.name);

export function findJobFunction(name: string): JobFunctionTemplate | undefined {
  return JOB_FUNCTIONS.find((f) => f.name === name);
}

// Sugestões para o painel "Requisitos do cargo" (idiomas e certificações).
export const LANGUAGE_OPTIONS: string[] = [
  'Português',
  'Inglês',
  'Francês',
  'Espanhol',
  'Alemão',
  'Italiano',
  'Mandarim',
  'Árabe',
  'Umbundu',
  'Kimbundu',
  'Kikongo',
];

export const CERTIFICATION_OPTIONS: string[] = [
  'PMP — Project Management Professional',
  'Scrum Master (PSM/CSM)',
  'ITIL Foundation',
  'ISO 9001 — Auditor interno',
  'ISO 27001 — Segurança da informação',
  'AWS Certified Cloud Practitioner',
  'Microsoft Certified (Azure/365)',
  'CISA — Auditoria de sistemas',
  'ACCA / CPA — Contabilidade',
  'Higiene e segurança no trabalho',
  'Primeiros socorros',
  'Carta de condução',
];
