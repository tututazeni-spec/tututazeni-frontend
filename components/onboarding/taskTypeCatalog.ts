// components/onboarding/taskTypeCatalog.ts
// Tipos de tarefa sugeridos por categoria, usados no modal "Nova tarefa".
// O texto escolhido passa a ser o título da tarefa; "Outro" permite escrever
// um tipo manualmente.

import type { TaskCategory } from './types';

export const MANUAL_TASK_TYPE = '__MANUAL__';

export const TASK_TYPES_BY_CATEGORY: Record<TaskCategory, string[]> = {
  DOCUMENTS: [
    'Entregar documento de identificação',
    'Entregar NIF e NIB',
    'Entregar certificados de habilitações',
    'Assinar contrato de trabalho',
    'Assinar termo de confidencialidade',
    'Entregar registo criminal',
  ],
  IT_ACCESS: [
    'Criar conta de email',
    'Entregar computador e equipamento',
    'Configurar acessos aos sistemas',
    'Entregar cartão de acesso',
    'Configurar telefone e extensão',
    'Instalar software necessário',
  ],
  TRAINING: [
    'Formação de acolhimento',
    'Formação de segurança e saúde no trabalho',
    'Formação em produtos e serviços',
    'Formação nos sistemas internos',
    'Formação em código de conduta',
  ],
  SOCIAL: [
    'Apresentação à equipa',
    'Almoço de boas-vindas',
    'Visita às instalações',
    'Apresentação aos restantes departamentos',
  ],
  BENEFITS: [
    'Adesão ao seguro de saúde',
    'Adesão a outros benefícios',
    'Explicação do plano de benefícios',
    'Registo na segurança social',
  ],
  ADMIN: [
    'Preencher ficha de colaborador',
    'Registar dados bancários',
    'Atribuir número de colaborador',
    'Registar assiduidade e horário',
  ],
  MEETING: [
    'Reunião de boas-vindas',
    'Reunião com o gestor directo',
    'Reunião com o RH',
    'Reunião de equipa',
  ],
  POLICIES: [
    'Ler o manual do colaborador',
    'Ler a política de segurança da informação',
    'Ler o código de conduta',
    'Ler a política de privacidade',
  ],
  EVALUATION: [
    'Avaliação de integração',
    'Avaliação de período experimental',
    'Avaliação de competências',
    'Inquérito de satisfação',
  ],
  ONE_ON_ONE: [
    'Reunião 1:1 com o gestor',
    'Reunião 1:1 com o buddy',
    'Reunião 1:1 de acompanhamento',
    'Reunião 1:1 de feedback',
  ],
};
