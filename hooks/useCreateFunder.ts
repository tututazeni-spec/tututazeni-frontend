// hooks/useCreateFunder.ts
// Formulário + submissão de criação de financiador. Extraído de
// app/(platform)/crm/funders/novo/page.tsx.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email as emailValidator, required } from '@/lib/validation';

const INITIAL_FORM = {
  type: 'BILATERAL',
  name: '',
  legalName: '',
  category: '',
  contactName: '',
  contactTitle: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  country: '',
  region: '',
  nif: '',
  currency: 'AOA',
  reportingReqs: '',
  relationshipStart: '',
  notes: '',
  nextReportDue: '',
};

export function useCreateFunder() {
  const router = useRouter();

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(INITIAL_FORM, {
    name: [required()],
    email: [emailValidator()],
  });
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createMut = useApiMutation(
    () => {
      const payload: Partial<typeof form> = {
        type: form.type,
        name: form.name,
      };
      for (const [k, v] of Object.entries(form) as Array<
        [keyof typeof form, string]
      >) {
        if (k === 'type' || k === 'name') continue;
        if (v !== '' && v != null) payload[k] = v;
      }
      return apiClient.post<{ id: string }>('/crm/funders', payload);
    },
    {
      invalidateKeys: [queryKeys.funders.lists()],
      onSuccess: (created) => router.push(`/crm/funders/${created.id}`),
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
    onCancel: () => router.push('/crm/funders'),
  };
}
