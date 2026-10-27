import type { LegalDoc } from './types';

// RASCUNHO v0.1 para revisão jurídica (ver docs/legal/README.md). Campos [entre parênteses rectos] por preencher.
// Factos técnicos (dados, fornecedores, retenção) devem coincidir com docs/legal/subprocessadores.md e medidas-de-seguranca.md.
export const PRIVACIDADE: LegalDoc = {
  version: '0.1',
  updated: '2026-10-27',
  title: 'Política de privacidade',
  intro:
    'Explicamos que dados pessoais são tratados na plataforma INNOVA, para quê, com quem são partilhados e que direitos tem. Esta política aplica-se à lei angolana de protecção de dados pessoais [confirmar referência legal].',
  sections: [
    {
      title: '1. Quem é responsável pelos seus dados',
      paragraphs: [
        'Para os dados que a sua empresa (o "Cliente") usa na plataforma — o seu perfil, formação, avaliações, licenças, recibos — o responsável pelo tratamento é a sua empresa. A EVOS, LDA. ("Fornecedor") trata-os por conta da sua empresa, como subcontratante, e segue as instruções dela.',
        'Para os dados necessários à segurança, ao suporte e ao funcionamento técnico da plataforma, o Fornecedor trata-os por conta própria. [Identificação, sede e contacto do responsável/encarregado de protecção de dados.]',
      ],
    },
    {
      title: '2. Que dados tratamos',
      paragraphs: [
        'Identificação e contacto: nome, e-mail, telefone, número de colaborador, fotografia de perfil.',
        'Dados profissionais: cargo, departamento, chefia, histórico, competências e planos de desenvolvimento.',
        'Dados de formação e avaliação: inscrições, progresso, notas, certificados, avaliações de desempenho e 360º.',
        'Dados de gestão de pessoas: pedidos de férias e licenças, presenças, declarações; e, se a sua empresa usar o módulo de pagamentos, recibos de vencimento, NIF e NIB (estes dois são guardados cifrados).',
        'Voz e imagem: apenas se usar aulas ao vivo ou o Avatar Training.',
        'Dados técnicos: registos de acesso (data, IP, dispositivo), ações na plataforma para fins de auditoria e segurança, e os ecrãs que visita para medirmos a utilização do produto.',
        'Conteúdo que escreve: mensagens ao Tutor de IA, pedidos de suporte, feedback e comentários.',
      ],
    },
    {
      title: '3. Para que usamos e com que fundamento',
      paragraphs: [
        'Prestar o serviço à sua empresa e permitir que use a plataforma (execução do contrato entre a sua empresa e o Fornecedor, e finalidades que a sua empresa determina, como gestão de formação e de recursos humanos).',
        'Segurança, prevenção de fraude e auditoria (interesse legítimo e obrigações legais).',
        'Suporte e melhoria do produto, com dados agregados de utilização e o feedback que nos dá (interesse legítimo).',
        'Cumprir obrigações legais (por exemplo, conservação de recibos e registos laborais).',
        '[O advogado confirma a base legal de cada finalidade, e onde é necessário consentimento — por exemplo, imagem e voz.]',
      ],
    },
    {
      title: '4. Com quem partilhamos',
      paragraphs: [
        'Com a sua empresa, conforme o seu perfil: chefias e RH veem os dados que o cargo lhes permite.',
        'Com prestadores que nos ajudam a operar a plataforma (subcontratantes): alojamento e cópias de segurança; envio de e-mail, SMS e WhatsApp; videoconferência das aulas ao vivo; monitorização de erros; e, se a sua empresa os ativar, fornecedores de inteligência artificial, voz e avatar. A lista completa e atualizada está disponível a pedido e no contrato da sua empresa.',
        'Não vendemos dados pessoais nem os usamos para publicidade. Só os divulgamos a autoridades quando a lei o exigir.',
      ],
    },
    {
      title: '5. Inteligência artificial',
      paragraphs: [
        'Quando usa o Tutor de IA, o texto da sua pergunta e o contexto a que o seu perfil já tem acesso são enviados ao fornecedor de IA escolhido para gerar a resposta. Não coloque no Tutor informação que não queira partilhar com esses fornecedores. A IA não toma decisões sobre si; as decisões de recursos humanos são tomadas por pessoas.',
      ],
    },
    {
      title: '6. Transferências para fora de Angola',
      paragraphs: [
        'Alguns fornecedores (por exemplo, de IA, voz, SMS e WhatsApp) estão fora de Angola. Só enviamos dados para eles quando a funcionalidade é ativada pela sua empresa e com as garantias exigidas pela lei [o advogado detalha o mecanismo].',
      ],
    },
    {
      title: '7. Durante quanto tempo guardamos',
      paragraphs: [
        'Enquanto a sua empresa mantiver a conta e durante os prazos que ela definir. Dados de ex-colaboradores são anonimizados automaticamente depois do prazo de retenção configurado, salvo obrigação legal de os conservar. Cópias de segurança são rodadas ciclicamente [prazo]. Terminado o contrato, os dados são devolvidos e eliminados conforme o contrato.',
      ],
    },
    {
      title: '8. Os seus direitos',
      paragraphs: [
        'Pode pedir: acesso aos seus dados, retificação, eliminação, limitação, oposição ao tratamento e uma cópia exportável. Pode retirar o consentimento que tenha dado, sem afetar o que já foi tratado.',
        'Como exercer: fale com o responsável de RH da sua empresa ou abra um pedido em Ajuda e Suporte, indicando que é um pedido de dados pessoais. Responderemos, em articulação com a sua empresa, em [prazo].',
        'Se achar que os seus direitos não foram respeitados, pode apresentar reclamação à autoridade de protecção de dados [identificar a autoridade].',
      ],
    },
    {
      title: '9. Como protegemos os dados',
      paragraphs: [
        'Ligação cifrada (HTTPS), controlo de acessos por perfil, cifra de dados financeiros sensíveis, registo de acessos e alterações, cópias de segurança, verificação de ficheiros carregados, e um processo para responder a incidentes e avisar a sua empresa. Nenhum sistema é infalível; se ocorrer uma violação de dados pessoais, avisamos a sua empresa sem demora.',
      ],
    },
    {
      title: '10. Cookies',
      paragraphs: [
        'Usamos apenas cookies estritamente necessários ao funcionamento. Por isso não mostramos um aviso para os aceitar ou recusar: não dependem de consentimento e não servem para o identificar fora da plataforma.',
        'Sessão: mantém a sua sessão iniciada e expira quando termina a sessão ou ao fim do prazo de inatividade.',
        'Proteção contra pedidos forjados (csrf_token): impede que outro site faça ações em seu nome; renova-se no início de sessão.',
        'Tema (innova-theme): guarda a sua escolha de tema claro ou escuro.',
        'Guardamos ainda no seu navegador, sem os enviar a terceiros, preferências de utilização como o histórico das suas pesquisas recentes. Pode apagá-las nas definições do navegador.',
        'Não usamos cookies de publicidade, de análise de terceiros nem de rastreio. Se um dia passarmos a usá-los, pediremos o seu consentimento antes e atualizaremos esta política.',
      ],
    },
    {
      title: '11. Alterações',
      paragraphs: [
        'Quando esta política mudar de forma importante, mostramos o novo texto e pedimos que o aceite. A data e a versão estão no topo.',
      ],
    },
  ],
};
