// Registo de alterações para clientes ("Novidades"). Mais recente primeiro.
// Escrever o que muda PARA O UTILIZADOR, em linguagem simples; o registo técnico fica no CHANGELOG.md.

export type NovidadeTipo = 'novo' | 'melhoria' | 'correcao';

export interface Novidade {
  /** AAAA-MM-DD */
  data: string;
  titulo: string;
  descricao: string;
  tipo: NovidadeTipo;
}

export const NOVIDADES: readonly Novidade[] = [
  {
    data: '2026-10-27',
    titulo: 'Ajuda e Suporte',
    descricao:
      'Nova página com perguntas frequentes, pedidos de suporte com tempo de resposta indicado e estas novidades. Antes de abrir um pedido, sugerimos artigos que podem resolver o assunto logo.',
    tipo: 'novo',
  },
  {
    data: '2026-10-27',
    titulo: 'Primeiros passos e feedback',
    descricao:
      'Um guia no painel mostra os passos para começar a usar a plataforma e fecha sozinho quando estiverem feitos. O botão de feedback no topo permite enviar ideias, problemas ou elogios em segundos.',
    tipo: 'novo',
  },
  {
    data: '2026-10-27',
    titulo: 'Plataforma no telemóvel',
    descricao:
      'O menu lateral passa a abrir por um botão em ecrãs pequenos e o conteúdo ocupa toda a largura. As mensagens de erro passam a dizer o que fazer a seguir.',
    tipo: 'melhoria',
  },
  {
    data: '2026-10-27',
    titulo: 'Página de estado',
    descricao:
      'Pode consultar em qualquer momento se a plataforma está operacional e ver o histórico de incidentes, sem iniciar sessão.',
    tipo: 'novo',
  },
  {
    data: '2026-10-27',
    titulo: 'Privacidade dos seus dados',
    descricao:
      'Pode pedir a exportação dos seus dados pessoais e a empresa passa a ter ferramentas para responder aos pedidos dos titulares e para apagar automaticamente dados que já não precisa de guardar.',
    tipo: 'melhoria',
  },
  {
    data: '2026-10-25',
    titulo: 'Tema escuro',
    descricao:
      'Escolha entre tema claro, escuro ou o do seu dispositivo, no botão do topo da página.',
    tipo: 'novo',
  },
  {
    data: '2026-10-24',
    titulo: 'Ficheiros mais seguros',
    descricao:
      'Os ficheiros que carrega são verificados antes de ficarem disponíveis, e os descarregamentos passaram a ser mais seguros.',
    tipo: 'melhoria',
  },
  {
    data: '2026-10-22',
    titulo: 'Certificados e tutora Ísis',
    descricao:
      'Novo módulo de certificados com verificação pública do código, e a Ísis passa a consultar os dados a que tem acesso para responder melhor, por voz ou por texto.',
    tipo: 'novo',
  },
];
