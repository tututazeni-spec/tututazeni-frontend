// components/ai-tutor/constants.ts
// Acções rápidas do chat e navegação do módulo de Tutor IA
// (docs/ai-tutor.md). Extraído de app/(platform)/ai-tutor/page.tsx.

import type { View } from './types';

export const QUICK_ACTIONS = [
  {
    label: 'Explicar de outra forma',
    value: 'Podes explicar isso de outra forma, com um exemplo prático?',
  },
  {
    label: 'Resumo',
    value: 'Faz um resumo dos pontos mais importantes até agora',
  },
  { label: 'Próximo passo', value: 'O que devo estudar ou fazer a seguir?' },
  {
    label: 'Exemplo real',
    value: 'Podes dar um exemplo prático e real desta matéria?',
  },
  {
    label: 'Questionário rápido',
    value:
      'Cria um questionário de 5 perguntas sobre o que acabámos de discutir',
  },
];

// Navegação para colaboradores — mantém o Chat pessoal e acrescenta as
// secções novas (Base de Conhecimento, Sessões, Exercícios).
export const EMPLOYEE_NAV: Array<{ id: View; label: string }> = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'chat', label: 'Chat' },
  { id: 'knowledge', label: 'Base de Conhecimento' },
  { id: 'sessions', label: 'Sessões' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'recommendations', label: 'Recomendações' },
];

// Navegação para ADMIN/RH — consola de gestão do AI Tutor
// (docs/ai-tutor.md, "Abas principais (a acrescentar)").
export const ADMIN_NAV: Array<{ id: View; label: string }> = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'knowledge', label: 'Base de Conhecimento' },
  { id: 'sessions', label: 'Sessões' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Configurações' },
];

export const TITLES: Record<View, string> = {
  overview: 'Visão Geral',
  chat: 'Ísis — Tutor IA',
  knowledge: 'Base de Conhecimento',
  sessions: 'Sessões',
  exercises: 'Exercícios',
  recommendations: 'Recomendações personalizadas',
  analytics: 'Analytics',
  settings: 'Configurações',
};
