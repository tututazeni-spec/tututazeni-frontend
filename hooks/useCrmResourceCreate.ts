// hooks/useCrmResourceCreate.ts
// Motor partilhado dos formulários de criação do CRM (funders / partners /
// beneficiaries). Antes desta extracção, useCreateFunder / useCreatePartner /
// useCreateBeneficiary eram praticamente idênticos: useFormValidation +
// estado `submitError` + `error = validationError || submitError` + uma
// mutação que constrói o payload (mantém os campos fixos, descarta os vazios,
// POST, invalida a lista, redirect para o detalhe) + `submit` + `onCancel`.
//
// As únicas diferenças reais — o formulário inicial, o endpoint, os campos
// obrigatórios e a coerção numérica — passam a ser configuração. Este hook
// NÃO é consumido directamente por componentes; cada hook específico continua
// a existir como wrapper, para os *CreateView não mudarem.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QueryKey } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useFormValidation } from '@/hooks/useFormValidation';
import { apiClient } from '@/lib/apiClient';
import type { Schema } from '@/lib/validation';

interface CrmResourceCreateConfig<F extends Record<string, string>> {
  /** Path REST do recurso — ex.: '/crm/funders'. Também é para onde `onCancel` volta. */
  basePath: string;
  /** Key da lista a invalidar após criar — ex.: queryKeys.funders.lists(). */
  listKey: QueryKey;
  /** Valores iniciais do formulário (todos string, como nos 3 formulários actuais). */
  initialForm: F;
  /** Regras de validação passadas a useFormValidation. */
  schema: Schema<F>;
  /** Campos sempre enviados, mesmo vazios (os obrigatórios) — ex.: ['type', 'name']. */
  alwaysInclude: readonly (keyof F)[];
  /** Campos a converter para Number quando presentes — ex.: ['annualValue']. */
  numericFields?: readonly (keyof F)[];
}

export function useCrmResourceCreate<F extends Record<string, string>>(
  config: CrmResourceCreateConfig<F>,
) {
  const {
    basePath,
    listKey,
    initialForm,
    schema,
    alwaysInclude,
    numericFields,
  } = config;
  const router = useRouter();

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(initialForm, schema);
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const alwaysSet = new Set<string>(alwaysInclude as readonly string[]);
  const numericSet = new Set<string>((numericFields ?? []) as readonly string[]);

  const createMut = useApiMutation(
    () => {
      // Remove campos vazios para não falhar validação dos enums/datas.
      const payload: Record<string, string | number> = {};
      for (const k of alwaysInclude) payload[k as string] = form[k];
      for (const [k, v] of Object.entries(form)) {
        if (alwaysSet.has(k)) continue;
        if (v === '' || v == null) continue;
        payload[k] = numericSet.has(k) ? Number(v) : v;
      }
      return apiClient.post<{ id: string }>(basePath, payload);
    },
    {
      invalidateKeys: [listKey],
      onSuccess: (created) => router.push(`${basePath}/${created.id}`),
      onError: (e) => setSubmitError(e.message || 'Erro inesperado'),
    },
  );
  const saving = createMut.isPending;

  const submit = withValidation(() => {
    setSubmitError('');
    createMut.mutate(undefined);
  });

  return {
    form,
    setField,
    error,
    saving,
    submit,
    onCancel: () => router.push(basePath),
  };
}
