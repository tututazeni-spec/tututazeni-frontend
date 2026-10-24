// hooks/useFormState.ts
// Estado de um formulário como um único objecto, em vez de N `useState`.
//
// Para formulários simples (sem regras de validação por campo — para isso há
// useFormValidation) cujos campos mudam em conjunto: criar/editar num modal.
// Um objecto facilita montar o payload, repor o formulário de uma vez e
// passar a um subcomponente sem 2N props (valor + setter por campo).
//
//   const { values, set } = useFormState(INITIAL);
//   <Input value={values.title} onChange={(e) => set('title', e.target.value)} />

'use client';

import { useCallback, useState } from 'react';

export function useFormState<T extends object>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  /** Actualiza um campo; `value` tipado pelo próprio campo. */
  const set = useCallback(
    <K extends keyof T>(key: K, value: T[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    [],
  );

  /** Repõe o formulário nos valores iniciais. */
  const reset = useCallback(() => setValues(initial), [initial]);

  return { values, set, setValues, reset };
}
