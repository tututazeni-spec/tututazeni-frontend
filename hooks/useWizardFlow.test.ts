import { describe, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  INITIAL_WIZARD_FLOW,
  useWizardFlow,
  wizardFlowReducer,
} from './useWizardFlow';

describe('wizardFlowReducer', () => {
  test('next avança e back recua sem passar de 0', () => {
    let s = wizardFlowReducer(INITIAL_WIZARD_FLOW, { type: 'next' });
    expect(s.step).toBe(1);
    s = wizardFlowReducer(s, { type: 'back' });
    s = wizardFlowReducer(s, { type: 'back' });
    expect(s.step).toBe(0);
  });

  test('goTo salta para a etapa indicada', () => {
    const s = wizardFlowReducer(INITIAL_WIZARD_FLOW, { type: 'goTo', step: 3 });
    expect(s.step).toBe(3);
  });

  test('begin marca busy e limpa o erro anterior; end só desmarca busy', () => {
    const failed = wizardFlowReducer(INITIAL_WIZARD_FLOW, {
      type: 'fail',
      message: 'falhou',
    });
    const started = wizardFlowReducer(failed, { type: 'begin' });
    expect(started).toMatchObject({ busy: true, error: '' });
    const ended = wizardFlowReducer(
      wizardFlowReducer(started, { type: 'fail', message: 'outra' }),
      { type: 'end' },
    );
    expect(ended).toMatchObject({ busy: false, error: 'outra' });
  });

  test('fail não altera a etapa', () => {
    const s = wizardFlowReducer(
      { ...INITIAL_WIZARD_FLOW, step: 2 },
      { type: 'fail', message: 'x' },
    );
    expect(s.step).toBe(2);
  });
});

describe('useWizardFlow', () => {
  test('expõe o fluxo completo guardar → avançar', () => {
    const { result } = renderHook(() => useWizardFlow());
    act(() => result.current.begin());
    expect(result.current.busy).toBe(true);
    act(() => {
      result.current.next();
      result.current.end();
    });
    expect(result.current).toMatchObject({ step: 1, busy: false, error: '' });
  });

  test('as acções mantêm a mesma referência entre renders', () => {
    const { result, rerender } = renderHook(() => useWizardFlow());
    const first = result.current;
    rerender();
    for (const k of ['next', 'back', 'goTo', 'begin', 'end', 'fail'] as const) {
      expect(result.current[k]).toBe(first[k]);
    }
  });
});
