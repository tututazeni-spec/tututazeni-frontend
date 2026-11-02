// components/ai-tutor/exportToFormalEvaluation.ts
// Converte os exercícios gerados pela Ísis nas perguntas de uma avaliação
// formal (POST /assessments, type EXAM). Escolha múltipla, verdadeiro/falso e
// simulações têm resposta certa e corrigem-se sozinhos; perguntas abertas,
// casos práticos e cenários vão como resposta aberta (revisão manual) com a
// resposta-modelo guardada como explicação.

import type {
  OpenQuestionItem,
  PracticalCaseItem,
  QuizQuestion,
  ScenarioItem,
  SimulationItem,
  TrueFalseItem,
} from './types';

export interface ExportQuestion {
  type: 'MULTIPLE_CHOICE_SINGLE' | 'OPEN_TEXT';
  questionText: string;
  weight: number;
  seq: number;
  options?: { text: string; isCorrect: boolean }[];
  explanation?: string;
}

/** Tipos de exercício que podem ser exportados para Avaliações formais. */
export const EXPORTABLE_TYPES = [
  'QUIZ',
  'TRUE_FALSE',
  'OPEN_QUESTION',
  'PRACTICAL_CASE',
  'SIMULATION',
  'SCENARIO',
] as const;

export function isExportable(type: string): boolean {
  return (EXPORTABLE_TYPES as readonly string[]).includes(type);
}

export function buildQuestions(
  type: string,
  content: unknown,
): ExportQuestion[] {
  if (!Array.isArray(content)) return [];
  const withSeq = (qs: Omit<ExportQuestion, 'seq' | 'weight'>[]) =>
    qs.map((q, seq) => ({ ...q, weight: 1, seq }));

  switch (type) {
    case 'QUIZ':
      return withSeq(
        (content as QuizQuestion[]).map((q) => ({
          type: 'MULTIPLE_CHOICE_SINGLE' as const,
          questionText: q.question,
          options: (q.options ?? []).map((text) => ({
            text,
            isCorrect: text.startsWith(q.correct),
          })),
          explanation: q.explanation,
        })),
      );
    case 'TRUE_FALSE':
      return withSeq(
        (content as TrueFalseItem[]).map((q) => ({
          type: 'MULTIPLE_CHOICE_SINGLE' as const,
          questionText: q.statement,
          options: [
            { text: 'Verdadeiro', isCorrect: q.isTrue },
            { text: 'Falso', isCorrect: !q.isTrue },
          ],
          explanation: q.explanation,
        })),
      );
    case 'SIMULATION':
      return withSeq(
        (content as SimulationItem[]).map((q) => ({
          type: 'MULTIPLE_CHOICE_SINGLE' as const,
          questionText: q.situation,
          options: q.options.map((o) => ({
            text: o.text,
            isCorrect: !!o.isBest,
          })),
          explanation: q.options
            .map((o) => `${o.text}: ${o.consequence}`)
            .join('\n'),
        })),
      );
    case 'OPEN_QUESTION':
      return withSeq(
        (content as OpenQuestionItem[]).map((q) => ({
          type: 'OPEN_TEXT' as const,
          questionText: q.question,
          explanation: q.modelAnswer,
        })),
      );
    case 'PRACTICAL_CASE':
      return withSeq(
        (content as PracticalCaseItem[]).map((c) => ({
          type: 'OPEN_TEXT' as const,
          questionText: `${c.scenario}\n\n${c.question}`,
          explanation: c.keyPoints?.join('; '),
        })),
      );
    case 'SCENARIO':
      return withSeq(
        (content as ScenarioItem[]).map((s) => ({
          type: 'OPEN_TEXT' as const,
          questionText: `${s.context}\n\n${s.challenge}${
            s.reflectionQuestion ? `\n\n${s.reflectionQuestion}` : ''
          }`,
        })),
      );
    default:
      return [];
  }
}
