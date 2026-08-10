// components/ai-tutor/constants.ts
// Acções rápidas do chat e navegação do módulo de Tutor IA. Extraído
// de app/(platform)/ai-tutor/page.tsx.

import type { View } from './types';

export const QUICK_ACTIONS = [
  {
    label: '❓ Explicar de outra forma',
    value: 'Podes explicar isso de outra forma, com um exemplo prático?',
  },
  {
    label: '📝 Resumo',
    value: 'Faz um resumo dos pontos mais importantes até agora',
  },
  { label: '🎯 Próximo passo', value: 'O que devo estudar ou fazer a seguir?' },
  {
    label: '💡 Exemplo real',
    value: 'Podes dar um exemplo prático e real desta matéria?',
  },
  {
    label: '📊 Quiz rápido',
    value: 'Cria um quiz de 5 perguntas sobre o que acabámos de discutir',
  },
];

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'chat', label: '💬 Chat' },
  { id: 'generate', label: '⚡ Gerar conteúdo' },
  { id: 'recommendations', label: '🎯 Recomendações' },
  { id: 'history', label: '🕐 Histórico' },
];

export const TITLES: Record<View, string> = {
  chat: 'NOVA — Tutor IA',
  generate: 'Gerar conteúdo com IA',
  recommendations: 'Recomendações personalizadas',
  history: 'Histórico de sessões',
};
