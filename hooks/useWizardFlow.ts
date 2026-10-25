// hooks/useWizardFlow.ts
// Estado do fluxo de um wizard multi-passo (etapa actual, "a guardar", erro)
// num reducer, em vez de três useState com setters soltos. As transições
// ficam nomeadas e o reducer é puro, por isso testa-se sem montar UI.
//
// Os campos do formulário ficam em useFormState; aqui só o que é fluxo.
//
//   const { step, busy, error, next, back, goTo, begin, end, fail } =
//     useWizardFlow();
//   begin();                       // busy = true, limpa o erro
//   try { await save(); next(); }
//   catch (e) { fail(message); }
//   finally { end(); }             // busy = false

'use client';

import { useCallback, useReducer } from 'react';

export interface WizardFlowState {
  step: number;
  busy: boolean;
  error: string;
}

export type WizardFlowAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goTo'; step: number }
  | { type: 'begin' }
  | { type: 'end' }
  | { type: 'fail'; message: string };

export const INITIAL_WIZARD_FLOW: WizardFlowState = {
  step: 0,
  busy: false,
  error: '',
};

export function wizardFlowReducer(
  state: WizardFlowState,
  action: WizardFlowAction,
): WizardFlowState {
  switch (action.type) {
    case 'next':
      return { ...state, step: state.step + 1 };
    case 'back':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'goTo':
      return { ...state, step: Math.max(0, action.step) };
    case 'begin':
      return { ...state, busy: true, error: '' };
    case 'end':
      return { ...state, busy: false };
    case 'fail':
      return { ...state, error: action.message };
  }
}

export function useWizardFlow(initial: WizardFlowState = INITIAL_WIZARD_FLOW) {
  const [state, dispatch] = useReducer(wizardFlowReducer, initial);

  const next = useCallback(() => dispatch({ type: 'next' }), []);
  const back = useCallback(() => dispatch({ type: 'back' }), []);
  const goTo = useCallback(
    (step: number) => dispatch({ type: 'goTo', step }),
    [],
  );
  const begin = useCallback(() => dispatch({ type: 'begin' }), []);
  const end = useCallback(() => dispatch({ type: 'end' }), []);
  const fail = useCallback(
    (message: string) => dispatch({ type: 'fail', message }),
    [],
  );

  return { ...state, next, back, goTo, begin, end, fail };
}
