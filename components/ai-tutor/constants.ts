// components/ai-tutor/constants.ts
// Acções rápidas do chat e navegação do módulo de Tutor IA
// (docs/ai-tutor.md). Extraído de app/(platform)/ai-tutor/page.tsx.

import {
  BarChart2,
  BookOpen,
  Dumbbell,
  History,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { PillTabItem } from '@/components/ui/PillTabs';
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
export const EMPLOYEE_NAV: Array<PillTabItem & { id: View }> = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo do tutor',
    icon: LayoutDashboard,
  },
  {
    id: 'chat',
    label: 'Chat',
    hint: 'Conversa com a Ísis',
    icon: MessageCircle,
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    hint: 'Fontes de conteúdo',
    icon: BookOpen,
  },
  {
    id: 'sessions',
    label: 'Sessões',
    hint: 'Conversas anteriores',
    icon: History,
  },
  {
    id: 'exercises',
    label: 'Exercícios',
    hint: 'Prática guiada',
    icon: Dumbbell,
  },
  {
    id: 'recommendations',
    label: 'Recomendações',
    hint: 'Sugestões para ti',
    icon: Sparkles,
  },
];

// Navegação para ADMIN/RH — consola de gestão do AI Tutor
// (docs/ai-tutor.md, "Abas principais (a acrescentar)"), mais o Chat
// (docs/ai-tutor.md secção 2), que também está disponível para ADMIN/RH.
export const ADMIN_NAV: Array<PillTabItem & { id: View }> = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo do tutor',
    icon: LayoutDashboard,
  },
  {
    id: 'chat',
    label: 'Chat',
    hint: 'Conversa com a Ísis',
    icon: MessageCircle,
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    hint: 'Fontes de conteúdo',
    icon: BookOpen,
  },
  {
    id: 'sessions',
    label: 'Sessões',
    hint: 'Conversas anteriores',
    icon: History,
  },
  {
    id: 'exercises',
    label: 'Exercícios',
    hint: 'Prática guiada',
    icon: Dumbbell,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    hint: 'Uso e resultados',
    icon: BarChart2,
  },
  {
    id: 'settings',
    label: 'Configurações',
    hint: 'Parâmetros do tutor',
    icon: Settings,
  },
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
