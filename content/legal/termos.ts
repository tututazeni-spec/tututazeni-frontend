import type { LegalDoc } from './types';

// RASCUNHO v0.1 para revisão jurídica (ver docs/legal/README.md). Campos [entre parênteses rectos] por preencher.
export const TERMOS: LegalDoc = {
  version: '0.1',
  updated: '2026-10-27',
  title: 'Termos de utilização',
  intro:
    'Estes termos explicam, em linguagem simples, as regras de uso da plataforma INNOVA. Ao entrar e usar a plataforma, aceita-os. A sua empresa (o seu "Cliente") tem também um contrato próprio com o Fornecedor; em caso de conflito sobre o serviço, prevalece esse contrato.',
  sections: [
    {
      title: '1. Quem presta o serviço',
      paragraphs: [
        'A plataforma INNOVA é prestada por EVOS, LDA. ("Fornecedor", "nós"), [NIF, sede e contactos], à sua empresa. Você usa a plataforma porque a sua empresa lhe deu acesso.',
      ],
    },
    {
      title: '2. O que é o serviço',
      paragraphs: [
        'A INNOVA reúne formação (cursos, aulas, avaliações, certificados) e gestão de pessoas (licenças, presenças, desempenho, recibos), conforme os módulos que a sua empresa contratou. Pode haver funcionalidades em teste (beta), sinalizadas como tal.',
      ],
    },
    {
      title: '3. A sua conta',
      paragraphs: [
        'A conta é pessoal e intransmissível. Guarde a sua senha em segurança e não a partilhe; nunca lhe pediremos a senha. Avise-nos de imediato se suspeitar que alguém acedeu à sua conta.',
        'O que vê e pode fazer depende do perfil que a sua empresa lhe atribuiu. Somos nós que operamos a plataforma, mas é a sua empresa que decide quem tem acesso a quê.',
      ],
    },
    {
      title: '4. Uso aceitável',
      paragraphs: [
        'Não pode: usar a plataforma para fins ilícitos; tentar aceder a dados ou contas de outras pessoas; contornar limites ou controlos de segurança; carregar vírus ou conteúdo malicioso; copiar, revender ou fazer engenharia inversa do software; extrair dados em massa por meios automáticos sem autorização (existe uma API própria para integrações); sobrecarregar a plataforma de forma abusiva.',
        'Podemos limitar ou suspender o acesso se o uso colocar em risco a segurança ou os outros utilizadores, e avisamos a sua empresa quando for possível.',
      ],
    },
    {
      title: '5. Conteúdos',
      paragraphs: [
        'Os conteúdos que você ou a sua empresa carregam (cursos, documentos, mensagens) continuam a ser seus ou da sua empresa. Dá-nos apenas o direito de os guardar e apresentar para prestar o serviço. Garante que tem direito de os carregar e que não violam direitos de terceiros nem a lei.',
        'Se achar que um conteúdo na plataforma viola os seus direitos, avise-nos pelo suporte e analisaremos sem demora [prazo].',
      ],
    },
    {
      title: '6. Tutor de IA',
      paragraphs: [
        'O Tutor de IA (Ísis) ajuda na aprendizagem, mas pode errar. As respostas não são aconselhamento profissional, jurídico ou médico, e não devem ser a única base de decisões importantes. Para responder, o Tutor usa apenas dados a que o seu perfil já dá acesso, e o texto enviado pode ser tratado por fornecedores de IA (ver a Política de Privacidade).',
      ],
    },
    {
      title: '7. Propriedade intelectual',
      paragraphs: [
        'O software, a marca INNOVA, o logótipo, o desenho e a documentação são do Fornecedor ou dos seus licenciantes e estão protegidos por lei. Estes termos dão-lhe apenas o direito de usar a plataforma enquanto a sua empresa tiver contrato, não de copiar ou explorar o software.',
      ],
    },
    {
      title: '8. Disponibilidade e suporte',
      paragraphs: [
        'Esforçamo-nos para que a plataforma esteja sempre disponível, mas podem ocorrer interrupções, planeadas (com aviso) ou não. O estado da plataforma pode ser consultado na página de estado, e o suporte responde nos tempos indicados em Ajuda e Suporte. Os compromissos de disponibilidade com a sua empresa constam do contrato.',
      ],
    },
    {
      title: '9. Os seus dados pessoais',
      paragraphs: [
        'O tratamento dos seus dados pessoais é explicado na Política de Privacidade, que faz parte destes termos.',
      ],
    },
    {
      title: '10. Fim do acesso',
      paragraphs: [
        'O acesso termina quando a sua empresa o retirar ou o contrato acabar. Pode pedir à sua empresa a exportação dos seus dados antes disso. Depois, os dados são tratados conforme a Política de Privacidade e o contrato.',
      ],
    },
    {
      title: '11. Responsabilidade',
      paragraphs: [
        '[A definir pelo advogado: limites de responsabilidade do Fornecedor perante os utilizadores finais, remetendo para o contrato com o Cliente quando aplicável. Nada nestes termos exclui responsabilidade que a lei não permita excluir.]',
      ],
    },
    {
      title: '12. Alterações a estes termos',
      paragraphs: [
        'Podemos atualizar estes termos. Quando a alteração for importante, mostramos o novo texto e pedimos que o aceite de novo para continuar a usar a plataforma. A data e a versão estão no topo.',
      ],
    },
    {
      title: '13. Lei aplicável e contactos',
      paragraphs: [
        '[Lei aplicável e foro: a definir pelo advogado.] Para qualquer questão sobre estes termos, use Ajuda e Suporte na plataforma ou escreva para [e-mail do suporte].',
      ],
    },
  ],
};
