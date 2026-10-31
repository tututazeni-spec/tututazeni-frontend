import { describe, expect, test } from 'vitest';
import {
  buildStructuredPayload,
  completeItemsOnly,
  criteriaProgress,
  hasSectionErrors,
  missingRequiredCriteria,
  validateSections,
} from './logic';
import {
  emptyImprovement,
  emptyRecommendation,
  emptyStrength,
  type ImprovementDraft,
  type RecommendationDraft,
  type StrengthDraft,
} from './types';

const strength = (o: Partial<StrengthDraft> = {}): StrengthDraft => ({
  ...emptyStrength(),
  competency: 'Comunicação',
  score: 4,
  description: 'Explica bem',
  ...o,
});
const area = (o: Partial<ImprovementDraft> = {}): ImprovementDraft => ({
  ...emptyImprovement(),
  competency: 'Prazos',
  score: 2,
  description: 'Atrasa entregas',
  priority: 'ALTA',
  ...o,
});
const rec = (o: Partial<RecommendationDraft> = {}): RecommendationDraft => ({
  ...emptyRecommendation(),
  action: 'Curso',
  objective: 'Cumprir prazos',
  actionType: 'FORMACAO',
  successIndicator: '90%',
  priority: 3,
  ...o,
});

describe('criteriaProgress / missingRequiredCriteria', () => {
  const qs = [
    { id: 1, type: 'SCALE', required: true },
    { id: 2, type: 'NA_ALLOWED', required: true },
    { id: 3, type: 'TEXT', required: true },
  ];
  test('conta nota e "Não aplicável" como respondido; ignora texto', () => {
    expect(
      criteriaProgress(qs, { 1: { score: 3 }, 2: { notApplicable: true } }),
    ).toEqual({
      answered: 2,
      total: 2,
      pct: 100,
    });
    expect(criteriaProgress(qs, {}).pct).toBe(0);
  });
  test('obrigatórias em falta incluem texto vazio', () => {
    expect(missingRequiredCriteria(qs, { 1: { score: 3 } })).toEqual([2, 3]);
    expect(
      missingRequiredCriteria(qs, {
        1: { score: 3 },
        2: { notApplicable: true },
        3: { comment: 'x' },
      }),
    ).toEqual([]);
  });
});

describe('validateSections', () => {
  test('registos completos não têm erros', () => {
    const a = area();
    const e = validateSections(
      [strength()],
      [a],
      [rec({ improvementKey: a.key })],
    );
    expect(hasSectionErrors(e)).toBe(false);
  });
  test('campos obrigatórios em falta', () => {
    const e = validateSections(
      [emptyStrength()],
      [emptyImprovement()],
      [emptyRecommendation()],
    );
    expect(e.strengths).toHaveLength(3);
    expect(e.improvements).toHaveLength(4);
    expect(e.recommendations).toHaveLength(5);
  });
  test('competências repetidas e nota alta sem justificação', () => {
    const e = validateSections(
      [strength(), strength({ competency: 'comunicacao' })],
      [area({ score: 5 })],
      [],
    );
    expect(e.strengths.join()).toMatch(/repetida/);
    expect(e.improvements).toHaveLength(0);
  });
  test('prazo no passado e área removida', () => {
    const e = validateSections(
      [],
      [],
      [rec({ dueDate: '2020-01-01', improvementKey: 'x' })],
      {
        today: new Date('2026-10-31'),
      },
    );
    expect(e.recommendations.join()).toMatch(/passado/);
    expect(e.recommendations.join()).toMatch(/removida/);
  });
});

describe('completeItemsOnly / buildStructuredPayload', () => {
  test('rascunho só leva itens completos e desliga áreas descartadas', () => {
    const a = area();
    const bad = emptyImprovement();
    const r = completeItemsOnly(
      [strength(), emptyStrength()],
      [a, bad],
      [rec({ improvementKey: bad.key }), emptyRecommendation()],
    );
    expect(r.strengths).toHaveLength(1);
    expect(r.improvements).toEqual([a]);
    expect(r.recommendations).toHaveLength(1);
    expect(r.recommendations[0].improvementKey).toBe('');
    expect(r.dropped).toBe(3);
  });
  test('payload usa key como ref e omite textos vazios', () => {
    const a = area();
    const p = buildStructuredPayload(
      [strength()],
      [a],
      [rec({ improvementKey: a.key })],
    );
    expect(p.improvementItems[0].ref).toBe(a.key);
    expect(p.recommendationItems[0].improvementRef).toBe(a.key);
    expect(p.strengthItems[0].evidence).toBeUndefined();
    expect(p.recommendationItems[0].dueDate).toBeUndefined();
  });
});
