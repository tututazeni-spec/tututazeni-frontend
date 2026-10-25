// components/avatar-training/builder/constants.ts
// Opções dos selectores do Construtor de Sessões.

import type { BuilderQuestion, BuilderStep } from '../types';

export const STEP_TYPES: { value: BuilderStep['type']; label: string }[] = [
  { value: 'CONTENT', label: 'Conteúdo' },
  { value: 'QUESTION', label: 'Pergunta' },
  { value: 'SCENARIO', label: 'Cenário' },
  { value: 'EXERCISE', label: 'Exercício' },
];

export const KINDS: { value: BuilderQuestion['kind']; label: string }[] = [
  { value: 'SINGLE', label: 'Escolha única' },
  { value: 'TRUE_FALSE', label: 'Verdadeiro / Falso' },
  { value: 'SHORT', label: 'Resposta curta' },
];
