// Perguntas frequentes da página Ajuda e Suporte. Texto escrito para utilizadores finais;
// acrescentar aqui as 3 maiores causas de pedidos de cada mês (ver docs/suporte/canais-e-base-de-conhecimento.md).

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  /** Rota do ecrã onde o utilizador resolve o assunto. */
  href?: string;
}

export const FAQ: readonly FaqItem[] = [
  {
    id: 'password',
    question: 'Esqueci-me da palavra-passe. Como recupero o acesso?',
    answer:
      'No ecrã de início de sessão escolha "Esqueci a senha" e siga o link enviado para o seu e-mail. Se o e-mail não chegar em 10 minutos, veja a pasta de spam e, se continuar sem chegar, abra um pedido de suporte com a categoria "Acesso".',
  },
  {
    id: 'enroll',
    question: 'Como me inscrevo num curso?',
    answer:
      'Abra "Cursos", escolha o curso e use o botão de inscrição. Cursos obrigatórios são atribuídos pela sua empresa e aparecem em "Meus cursos".',
    href: '/courses',
  },
  {
    id: 'certificate',
    question: 'Concluí o curso mas não vejo o certificado.',
    answer:
      'O certificado é emitido quando todas as lições estão concluídas e a nota mínima do curso foi atingida. Confirme o progresso em "Meus cursos". Se estiver a 100 % e o certificado não aparecer passados alguns minutos, abra um pedido indicando o nome do curso.',
    href: '/courses',
  },
  {
    id: 'leave',
    question: 'Como peço férias ou uma licença?',
    answer:
      'Em "Férias e Licenças" escolha o tipo, as datas e envie. O seu gestor recebe o pedido para aprovação e você é notificado da decisão.',
    href: '/leave',
  },
  {
    id: 'payslip',
    question: 'Onde vejo os meus recibos de vencimento?',
    answer:
      'Em "Folha de Pagamento", no separador de recibos salariais, encontra os recibos publicados para si. Um recibo só aparece depois de a empresa o publicar.',
    href: '/payroll',
  },
  {
    id: 'permission',
    question: 'Não tenho acesso a um ecrã ou botão que um colega tem.',
    answer:
      'O que cada pessoa vê depende do seu perfil na empresa. Peça ao responsável de RH ou ao administrador da sua empresa para rever o seu perfil; o suporte da plataforma não consegue alterar permissões em nome da empresa.',
  },
  {
    id: 'slow',
    question: 'A plataforma está lenta ou não abre.',
    answer:
      'Veja primeiro a página de estado (ligação abaixo): se houver um incidente em curso já estamos a tratar dele e não precisa de abrir um pedido. Caso contrário, actualize a página e, se persistir, abra um pedido com prioridade "Alta" indicando o ecrã e a hora.',
  },
  {
    id: 'mobile',
    question: 'Posso usar a plataforma no telemóvel?',
    answer:
      'Sim. No telemóvel o menu abre pelo botão no canto superior esquerdo. Para a melhor experiência use a versão recente do Chrome, Safari ou Edge.',
  },
];
