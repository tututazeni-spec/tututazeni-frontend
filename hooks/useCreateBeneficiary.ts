// hooks/useCreateBeneficiary.ts
// Extraído de app/(platform)/crm/beneficiaries/novo/page.tsx.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email as emailValidator, required } from '@/lib/validation';

const INITIAL_FORM = {
  type: 'INDIVIDUAL',
  fullName: '',
  category: '',
  gender: '',
  birthDate: '',
  nationality: '',
  nif: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  province: '',
  source: '',
  segment: '',
  notes: '',
  nextFollowUpAt: '',
};

export function useCreateBeneficiary() {
  const router = useRouter();

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(INITIAL_FORM, {
    fullName: [required()],
    email: [emailValidator()],
  });
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createMut = useApiMutation(
    () => {
      // Remove campos vazios para não falhar validação dos enums/datas.
      const payload: Partial<typeof form> = {
        type: form.type,
        fullName: form.fullName,
      };
      for (const [k, v] of Object.entries(form) as Array<
        [keyof typeof form, string]
      >) {
        if (k === 'type' || k === 'fullName') continue;
        if (v !== '' && v != null) payload[k] = v;
      }
      return apiClient.post<{ id: string }>('/crm/beneficiaries', payload);
    },
    {
      invalidateKeys: [queryKeys.beneficiaries.lists()],
      onSuccess: (created) => router.push(`/crm/beneficiaries/${created.id}`),
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
    onCancel: () => router.push('/crm/beneficiaries'),
  };
}
