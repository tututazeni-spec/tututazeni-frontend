// components/departments/departmentOptions.ts
// Listas de escolha do formulário "Novo departamento". Os campos são texto
// livre no backend, por isso o Combobox (allowCustom) também aceita um valor
// escrito à mão.

import type { ComboboxOption } from '@/components/ui/Combobox';

const asOptions = (labels: string[]): ComboboxOption[] =>
  labels.map((label) => ({ value: label, label }));

export const FUNCTIONAL_AREA_OPTIONS = asOptions([
  'Administração e serviços gerais',
  'Comercial e vendas',
  'Compras e logística',
  'Contabilidade e finanças',
  'Direção geral',
  'Formação e desenvolvimento',
  'Gestão de pessoas',
  'Jurídico e compliance',
  'Manutenção e infraestruturas',
  'Marketing e comunicação',
  'Operações',
  'Planeamento e controlo de gestão',
  'Produção',
  'Qualidade, segurança e ambiente',
  'Relações institucionais',
  'Tecnologias de informação',
]);

export const COST_CENTER_OPTIONS = asOptions([
  'CC-100 · Administração geral',
  'CC-200 · Comercial',
  'CC-300 · Financeiro',
  'CC-400 · Recursos humanos',
  'CC-500 · Operações',
  'CC-600 · Produção',
  'CC-700 · Tecnologias de informação',
  'CC-800 · Marketing',
  'CC-900 · Formação',
]);

/** Objectivos sugeridos por área funcional (chave = label da área). */
export const OBJECTIVES_BY_AREA: Record<string, string[]> = {
  'Administração e serviços gerais': [
    'Garantir o apoio administrativo eficiente a toda a organização',
    'Optimizar os custos de serviços gerais e contratos',
    'Assegurar instalações e meios logísticos operacionais',
  ],
  'Comercial e vendas': [
    'Atingir as metas de vendas e de crescimento da carteira',
    'Aumentar a satisfação e a fidelização dos clientes',
    'Expandir a presença em novos mercados e segmentos',
  ],
  'Compras e logística': [
    'Garantir o aprovisionamento no prazo e ao melhor custo',
    'Reduzir ruturas e excessos de stock',
    'Assegurar a qualidade e a fiabilidade dos fornecedores',
  ],
  'Contabilidade e finanças': [
    'Garantir informação financeira fiável e atempada',
    'Assegurar o cumprimento das obrigações fiscais e legais',
    'Manter o equilíbrio e a liquidez da tesouraria',
  ],
  'Direção geral': [
    'Definir e concretizar a estratégia da organização',
    'Garantir o alinhamento entre departamentos',
    'Assegurar a sustentabilidade e os resultados globais',
  ],
  'Formação e desenvolvimento': [
    'Desenvolver as competências críticas dos colaboradores',
    'Alinhar a formação com as necessidades do negócio',
    'Aumentar a eficácia e o retorno da formação',
  ],
  'Gestão de pessoas': [
    'Atrair e reter talento adequado à organização',
    'Promover um bom clima e as relações laborais',
    'Garantir a correcta gestão administrativa de pessoal',
  ],
  'Jurídico e compliance': [
    'Garantir a conformidade legal e regulamentar',
    'Mitigar riscos jurídicos e contratuais',
    'Assegurar a protecção de dados e a ética corporativa',
  ],
  'Manutenção e infraestruturas': [
    'Garantir a disponibilidade de equipamentos e instalações',
    'Reduzir avarias através de manutenção preventiva',
    'Optimizar custos de manutenção e energia',
  ],
  'Marketing e comunicação': [
    'Reforçar a notoriedade e a imagem da marca',
    'Gerar procura qualificada através de campanhas',
    'Assegurar comunicação interna e externa consistente',
  ],
  Operações: [
    'Garantir a execução eficiente das operações diárias',
    'Cumprir os níveis de serviço e prazos acordados',
    'Melhorar continuamente os processos operacionais',
  ],
  'Planeamento e controlo de gestão': [
    'Apoiar a decisão com informação de gestão fiável',
    'Garantir o cumprimento do orçamento e a análise de desvios',
    'Definir e acompanhar os indicadores estratégicos',
  ],
  Produção: [
    'Cumprir o plano de produção com qualidade',
    'Aumentar a produtividade e reduzir desperdícios',
    'Assegurar a segurança das equipas e dos equipamentos',
  ],
  'Qualidade, segurança e ambiente': [
    'Manter os sistemas de gestão certificados e conformes',
    'Prevenir acidentes e doenças profissionais',
    'Reduzir o impacto ambiental da actividade',
  ],
  'Relações institucionais': [
    'Fortalecer a relação com entidades e parceiros',
    'Representar e posicionar a organização externamente',
    'Promover a responsabilidade social da organização',
  ],
  'Tecnologias de informação': [
    'Garantir a disponibilidade e a segurança dos sistemas',
    'Apoiar o negócio com soluções tecnológicas adequadas',
    'Prestar suporte rápido e eficaz aos utilizadores',
  ],
};

/** Responsabilidades sugeridas por área funcional (chave = label da área). */
export const RESPONSIBILITIES_BY_AREA: Record<string, string[]> = {
  'Administração e serviços gerais': [
    'Gestão de expediente e arquivo',
    'Gestão de contratos de serviços e fornecedores gerais',
    'Gestão de frota e viaturas',
    'Apoio logístico a instalações e eventos',
  ],
  'Comercial e vendas': [
    'Prospecção e gestão de carteira de clientes',
    'Elaboração de propostas e negociação',
    'Definição e acompanhamento de metas de vendas',
    'Pós-venda e fidelização de clientes',
  ],
  'Compras e logística': [
    'Selecção e avaliação de fornecedores',
    'Gestão de encomendas e aprovisionamento',
    'Gestão de stocks e armazéns',
    'Coordenação de transporte e distribuição',
  ],
  'Contabilidade e finanças': [
    'Registo contabilístico e fecho de contas',
    'Gestão de tesouraria e pagamentos',
    'Elaboração e controlo de orçamentos',
    'Cumprimento de obrigações fiscais',
  ],
  'Direção geral': [
    'Definição da estratégia e dos objectivos globais',
    'Coordenação entre departamentos',
    'Representação institucional',
    'Acompanhamento de resultados e indicadores globais',
  ],
  'Formação e desenvolvimento': [
    'Levantamento de necessidades de formação',
    'Elaboração e execução do plano de formação',
    'Gestão de formadores e conteúdos',
    'Avaliação da eficácia da formação',
  ],
  'Gestão de pessoas': [
    'Recrutamento e selecção',
    'Processamento salarial e gestão de assiduidade',
    'Avaliação de desempenho',
    'Integração e relações laborais',
  ],
  'Jurídico e compliance': [
    'Apoio jurídico e análise de contratos',
    'Monitorização do cumprimento legal e regulamentar',
    'Gestão de contencioso',
    'Protecção de dados e políticas internas',
  ],
  'Manutenção e infraestruturas': [
    'Manutenção preventiva e correctiva de instalações',
    'Gestão de equipamentos e activos',
    'Coordenação de empreitadas e obras',
    'Gestão de energia e utilidades',
  ],
  'Marketing e comunicação': [
    'Definição do plano de marketing e da marca',
    'Gestão de comunicação interna e externa',
    'Gestão de redes sociais e conteúdos',
    'Organização de campanhas e eventos',
  ],
  Operações: [
    'Planeamento e execução das operações diárias',
    'Monitorização de indicadores operacionais',
    'Melhoria de processos',
    'Gestão de prazos e níveis de serviço',
  ],
  'Planeamento e controlo de gestão': [
    'Elaboração do plano e orçamento anual',
    'Análise de desvios e reporting de gestão',
    'Definição e acompanhamento de KPIs',
    'Apoio à decisão com análise de dados',
  ],
  Produção: [
    'Planeamento e programação da produção',
    'Controlo de produtividade e desperdício',
    'Gestão de equipas e turnos de produção',
    'Cumprimento de normas de produção',
  ],
  'Qualidade, segurança e ambiente': [
    'Gestão do sistema de qualidade e auditorias',
    'Prevenção de riscos e segurança no trabalho',
    'Gestão ambiental e de resíduos',
    'Tratamento de não conformidades',
  ],
  'Relações institucionais': [
    'Relação com entidades públicas e reguladores',
    'Gestão de parcerias e protocolos',
    'Representação da organização em eventos',
    'Responsabilidade social',
  ],
  'Tecnologias de informação': [
    'Gestão da infraestrutura e dos sistemas',
    'Suporte técnico a utilizadores',
    'Segurança da informação e cópias de segurança',
    'Desenvolvimento e manutenção de aplicações',
  ],
};
