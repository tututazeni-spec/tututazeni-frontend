// hooks/useFormValidation.ts
// Wrapper fino sobre lib/validation.ts — substitui o padrão duplicado de
// `useState` + `if (!form.x) setError(...)` em ~9 formulários. A lógica de
// validação em si (testada) vive em lib/validation.ts; este hook só liga
// esse resultado ao estado React (values/errors) e ao fluxo de submit.

'use client';

import { useState } from 'react';
import { firstError, validate, type Schema } from '@/lib/validation';

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  schema: Schema<T>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validateAll(): boolean {
    const nextErrors = validate(values, schema);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  /** Envolve o handler de submissão: só chama `onValid` se a validação passar. */
  function handleSubmit(onValid: () => void) {
    return (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();
      if (validateAll()) onValid();
    };
  }

  return {
    values,
    setValues,
    setField,
    errors,
    /** Primeira mensagem de erro — para o banner genérico já usado nos formulários. */
    errorMessage: firstError(errors),
    validateAll,
    handleSubmit,
  };
}
