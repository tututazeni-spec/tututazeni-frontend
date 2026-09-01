import { describe, expect, test } from 'vitest';
import {
  availableSurveyMilestones,
  isOverdue,
  nextLockedSurveyMilestone,
  resolveActiveMilestone,
} from './utils';

const START = '2026-01-01T00:00:00.000Z';
const day = (n: number) => new Date(START).getTime() + n * 86_400_000;

describe('isOverdue', () => {
  test('null → false; passado → true; futuro → false', () => {
    expect(isOverdue(null)).toBe(false);
    expect(isOverdue('2000-01-01T00:00:00.000Z')).toBe(true);
    expect(isOverdue('2999-01-01T00:00:00.000Z')).toBe(false);
  });
});

describe('availableSurveyMilestones', () => {
  test('só desbloqueia os marcos cujo dia já passou', () => {
    expect(
      availableSurveyMilestones(START, [], day(0)).map((m) => m.id),
    ).toEqual([]);
    expect(
      availableSurveyMilestones(START, [], day(3)).map((m) => m.id),
    ).toEqual(['DAY_1']);
    expect(
      availableSurveyMilestones(START, [], day(40)).map((m) => m.id),
    ).toEqual(['DAY_1', 'DAY_7', 'DAY_30']);
    expect(
      availableSurveyMilestones(START, [], day(200)).map((m) => m.id),
    ).toEqual(['DAY_1', 'DAY_7', 'DAY_30', 'DAY_90']);
  });

  test('remove os marcos já respondidos', () => {
    expect(
      availableSurveyMilestones(START, ['DAY_1', 'DAY_7'], day(40)).map(
        (m) => m.id,
      ),
    ).toEqual(['DAY_30']);
  });
});

describe('nextLockedSurveyMilestone', () => {
  test('devolve o próximo marco por abrir', () => {
    expect(nextLockedSurveyMilestone(START, [], day(3))?.id).toBe('DAY_7');
    expect(nextLockedSurveyMilestone(START, ['DAY_7'], day(3))?.id).toBe(
      'DAY_30',
    );
    expect(nextLockedSurveyMilestone(START, [], day(999))).toBeUndefined();
  });
});

describe('resolveActiveMilestone', () => {
  const avail = availableSurveyMilestones(START, [], day(40)); // DAY_1, DAY_7, DAY_30

  test('escolha válida vence', () => {
    expect(resolveActiveMilestone(avail, 'DAY_7')).toBe('DAY_7');
  });
  test('escolha inválida ou vazia → mais recente disponível', () => {
    expect(resolveActiveMilestone(avail, '')).toBe('DAY_30');
    expect(resolveActiveMilestone(avail, 'DAY_90')).toBe('DAY_30');
  });
  test('sem marcos disponíveis → ""', () => {
    expect(resolveActiveMilestone([], 'DAY_1')).toBe('');
  });
});
