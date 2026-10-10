// components/competencies/competencyIcons.ts
// Ícone por nome das competências-tipo conhecidas. Partilhado pelos cartões
// do catálogo e pela matriz; quem chama decide o ícone por omissão.

import {
  ChessKing,
  Lightbulb,
  MessageCircleMore,
  Monitor,
  Target,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

const NAME_ICONS: Array<[RegExp, LucideIcon]> = [
  [/resultado/i, Target],
  [/inova/i, Lightbulb],
  [/estrat/i, ChessKing],
  [/adaptab/i, Monitor],
  [/bem-estar|disciplina/i, UsersRound],
  [/comunica/i, MessageCircleMore],
  [/cliente/i, UserRound],
];

export function iconForCompetencyName(name: string): LucideIcon | undefined {
  return NAME_ICONS.find(([re]) => re.test(name))?.[1];
}
