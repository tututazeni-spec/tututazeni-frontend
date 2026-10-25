import { describe, expect, it } from 'vitest';
import {
  NEXT,
  addStep,
  assignErrorMessage,
  buildAssignPayload,
  buildSessionPayload,
  canCreateSession,
  canSaveSession,
  cleanBranches,
  cleanFailRules,
  cleanReinforcement,
  clampRetries,
  dropBranchesTo,
  idFromQuery,
  moveStep,
  nextStepKey,
  parseOptions,
  patchQuestion,
  patchStep,
  pickBranch,
  pruneBackwardBranches,
  questionChoices,
  removeStep,
  stepRefs,
  stepTypePatch,
  targetItems,
} from './logic';
import type { BuilderStep } from '../types';

const step = (key: string, over: Partial<BuilderStep> = {}): BuilderStep => ({
  key,
  title: key.toUpperCase(),
  type: 'CONTENT',
  ...over,
});

describe('perguntas', () => {
  it('questionChoices: V/F fixo, opções, ou vazio', () => {
    expect(questionChoices({ kind: 'TRUE_FALSE' })).toEqual([
      'Verdadeiro',
      'Falso',
    ]);
    expect(questionChoices({ kind: 'SINGLE', options: ['A', 'B'] })).toEqual([
      'A',
      'B',
    ]);
    expect(questionChoices({ kind: 'SHORT' })).toEqual([]);
  });

  it('parseOptions: uma por linha, sem vazias', () => {
    expect(parseOptions(' A \n\n B\n   \nC')).toEqual(['A', 'B', 'C']);
    expect(parseOptions('')).toEqual([]);
  });

  it('patchQuestion assume resposta curta sem pergunta prévia', () => {
    expect(patchQuestion(undefined, { prompt: 'P' })).toEqual({
      kind: 'SHORT',
      prompt: 'P',
    });
    expect(
      patchQuestion({ kind: 'SINGLE', options: ['A'] }, { prompt: 'P' }),
    ).toEqual({ kind: 'SINGLE', options: ['A'], prompt: 'P' });
  });

  it('stepTypePatch: pergunta/cenário criam pergunta; outros tipos limpam', () => {
    const base = step('a');
    expect(stepTypePatch(base, 'QUESTION')).toEqual({
      type: 'QUESTION',
      question: { kind: 'SHORT' },
      branches: undefined,
    });
    expect(stepTypePatch(base, 'SCENARIO').question).toEqual({
      kind: 'SINGLE',
    });

    const withData = step('a', {
      type: 'QUESTION',
      question: { kind: 'SINGLE', options: ['A', 'B'] },
      branches: { onCorrect: 'b' },
    });
    // mudar de pergunta para cenário preserva pergunta e ramificações
    expect(stepTypePatch(withData, 'SCENARIO')).toEqual({
      type: 'SCENARIO',
      question: { kind: 'SINGLE', options: ['A', 'B'] },
      branches: { onCorrect: 'b' },
    });
    expect(stepTypePatch(withData, 'CONTENT')).toEqual({
      type: 'CONTENT',
      question: undefined,
      branches: undefined,
    });
  });
});

describe('ramificações', () => {
  it('targetItems e pickBranch', () => {
    expect(
      targetItems(
        [
          { key: 'b', title: 'Segunda' },
          { key: 'c', title: '' },
        ],
        'Seguir em sequência',
      ),
    ).toEqual([
      { value: NEXT, label: 'Seguir em sequência' },
      { value: 'b', label: 'Segunda' },
      { value: 'c', label: 'c' },
    ]);
    expect(pickBranch(NEXT)).toBeUndefined();
    expect(pickBranch('b')).toBe('b');
  });

  it('cleanBranches descarta destinos vazios e devolve undefined sem nada', () => {
    expect(cleanBranches({})).toBeUndefined();
    expect(
      cleanBranches({ onCorrect: undefined, byOption: { A: '', B: '' } }),
    ).toBeUndefined();
    expect(
      cleanBranches({ onCorrect: 'c', byOption: { A: 'b', B: '' } }),
    ).toEqual({ onCorrect: 'c', byOption: { A: 'b' } });
  });

  it('dropBranchesTo retira só os saltos para a etapa removida', () => {
    const steps = [
      step('a', {
        branches: {
          onCorrect: 'b',
          onIncorrect: 'c',
          byOption: { X: 'b', Y: 'c' },
        },
      }),
      step('b'),
      step('c'),
    ];
    expect(dropBranchesTo(steps, 'b')[0].branches).toEqual({
      onIncorrect: 'c',
      byOption: { Y: 'c' },
    });
    // última ramificação removida → sem `branches`
    const only = [step('a', { branches: { onCorrect: 'b' } }), step('b')];
    expect(dropBranchesTo(only, 'b')[0].branches).toBeUndefined();
  });

  it('pruneBackwardBranches retira saltos para etapas anteriores', () => {
    const steps = [
      step('b'),
      step('a', { branches: { onCorrect: 'b', onIncorrect: 'c' } }),
      step('c'),
    ];
    expect(pruneBackwardBranches(steps)[1].branches).toEqual({
      onIncorrect: 'c',
    });
  });
});

describe('reforço e regras de falha', () => {
  it('cleanReinforcement mantém só valores com conteúdo', () => {
    expect(
      cleanReinforcement({ message: '   ', resourceUrl: '' }),
    ).toBeUndefined();
    expect(
      cleanReinforcement({ message: 'Reveja', reviewStepKey: 'a' }),
    ).toEqual({ message: 'Reveja', reviewStepKey: 'a' });
  });

  it('repetir a etapa leva 2 repetições por omissão', () => {
    expect(cleanReinforcement({ retryOnIncorrect: true })).toEqual({
      retryOnIncorrect: true,
      maxRetries: 2,
    });
    expect(
      cleanReinforcement({ retryOnIncorrect: true, maxRetries: 4 }),
    ).toEqual({ retryOnIncorrect: true, maxRetries: 4 });
    // sem repetir, maxRetries é descartado
    expect(cleanReinforcement({ maxRetries: 4 })).toBeUndefined();
  });

  it('clampRetries: 1 a 5, inválido volta a 2', () => {
    expect(clampRetries('3')).toBe(3);
    expect(clampRetries('0')).toBe(2);
    expect(clampRetries('')).toBe(2);
    expect(clampRetries('abc')).toBe(2);
    expect(clampRetries('99')).toBe(5);
    expect(clampRetries('-4')).toBe(1);
  });

  it('cleanFailRules', () => {
    expect(cleanFailRules({})).toEqual({});
    expect(cleanFailRules({ message: '  ', resourceUrl: ' ' })).toEqual({});
    expect(
      cleanFailRules({ message: 'Reveja', recommendSessionId: 7 }),
    ).toEqual({ onFail: { message: 'Reveja', recommendSessionId: 7 } });
  });
});

describe('lista de etapas', () => {
  it('nextStepKey/addStep saltam chaves ocupadas', () => {
    expect(nextStepKey([])).toBe('etapa-1');
    expect(nextStepKey([step('a'), step('etapa-2')])).toBe('etapa-3');
    // 2 etapas mas «etapa-3» já existe
    expect(nextStepKey([step('etapa-3'), step('x')])).toBe('etapa-4');
    expect(addStep([step('a')])).toEqual([
      step('a'),
      { key: 'etapa-2', title: 'Nova etapa', type: 'CONTENT' },
    ]);
  });

  it('patchStep só altera a etapa indicada', () => {
    const out = patchStep([step('a'), step('b')], 1, { title: 'X' });
    expect(out.map((s) => s.title)).toEqual(['A', 'X']);
  });

  it('moveStep troca vizinhas e retira saltos que passam a apontar para trás', () => {
    const steps = [
      step('a', { branches: { onCorrect: 'b' } }),
      step('b'),
      step('c'),
    ];
    const moved = moveStep(steps, 1, -1); // b sobe: [b, a, c]
    expect(moved.map((s) => s.key)).toEqual(['b', 'a', 'c']);
    // a deixou de ter b à frente → salto removido
    expect(moved[1].branches).toBeUndefined();
    // não altera o original
    expect(steps.map((s) => s.key)).toEqual(['a', 'b', 'c']);
  });

  it('moveStep fora dos limites não faz nada', () => {
    const steps = [step('a'), step('b')];
    expect(moveStep(steps, 0, -1)).toBe(steps);
    expect(moveStep(steps, 1, 1)).toBe(steps);
  });

  it('removeStep retira a etapa e os saltos para ela', () => {
    const steps = [
      step('a', { branches: { onCorrect: 'b', onIncorrect: 'c' } }),
      step('b'),
      step('c'),
    ];
    const out = removeStep(steps, 1);
    expect(out.map((s) => s.key)).toEqual(['a', 'c']);
    expect(out[0].branches).toEqual({ onIncorrect: 'c' });
  });

  it('stepRefs separa anteriores e posteriores', () => {
    const { earlier, later } = stepRefs([step('a'), step('b'), step('c')], 1);
    expect(earlier).toEqual([{ key: 'a', title: 'A' }]);
    expect(later).toEqual([{ key: 'c', title: 'C' }]);
  });
});

describe('sessão e atribuição', () => {
  it('canSaveSession exige título e títulos de etapa', () => {
    expect(canSaveSession({ title: 'S', steps: [step('a')] })).toBe(true);
    expect(canSaveSession({ title: '  ', steps: [step('a')] })).toBe(false);
    expect(
      canSaveSession({ title: 'S', steps: [step('a', { title: ' ' })] }),
    ).toBe(false);
  });

  it('buildSessionPayload', () => {
    expect(
      buildSessionPayload({
        title: ' S ',
        welcome: '  ',
        duration: '20',
        experienceType: 'GUIDED_LESSON',
        steps: [],
        rules: {},
      }),
    ).toEqual({
      title: 'S',
      welcomeMessage: undefined,
      durationMinutes: 20,
      experienceType: 'GUIDED_LESSON',
      steps: [],
      rules: {},
    });
  });

  it('canCreateSession', () => {
    expect(canCreateSession(undefined, 'T')).toBe(false);
    expect(canCreateSession('3', '  ')).toBe(false);
    expect(canCreateSession('3', 'T')).toBe(true);
  });

  it('idFromQuery só aceita dígitos', () => {
    expect(idFromQuery(' 42 ')).toBe(42);
    expect(idFromQuery('ana')).toBeNull();
    expect(idFromQuery('4a')).toBeNull();
    expect(idFromQuery('')).toBeNull();
  });

  it('buildAssignPayload converte o prazo para ISO', () => {
    expect(buildAssignPayload([1, 2], '', true)).toEqual({
      userIds: [1, 2],
      dueDate: undefined,
      mandatory: true,
    });
    expect(buildAssignPayload([1], '2026-05-01', false).dueDate).toBe(
      new Date('2026-05-01').toISOString(),
    );
  });

  it('assignErrorMessage explica o erro de publicação; outros passam', () => {
    expect(assignErrorMessage('Sessão publicada não encontrada')).toMatch(
      /Só é possível atribuir sessões publicadas/,
    );
    expect(assignErrorMessage('Sem permissão')).toBe('Sem permissão');
  });
});
