// hooks/useCreatePartner.ts
// Extraído de app/(platform)/crm/partners/novo/page.tsx.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email as emailValidator, required } from '@/lib/validation';

const INITIAL_FORM = {
  type: 'TECHNOLOGY',
  name: '',
  legalName: '',
  tier: 'STANDARD',
  contactName: '',
  contactTitle: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  linkedin: '',
  nif: '',
  address: '',
  city: '',
  province: '',
  annualValue: '',
  currency: 'AOA',
  revenueSharing: '',
  contractStart: '',
  contractEnd: '',
  notes: '',
  nextReviewAt: '',
};

const NUMERIC_FIELDS = new Set(['annualValue', 'revenueSharing']);

export function useCreatePartner() {
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
      const payload: Record<string, string | number> = {
        type: form.type,
        name: form.name,
      };
      for (const [k, v] of Object.entries(form)) {
        if (k === 'type' || k === 'name') continue;
        if (v === '' || v == null) continue;
        payload[k] = NUMERIC_FIELDS.has(k) ? Number(v) : v;
      }
      return apiClient.post<{ id: string }>('/crm/partners', payload);
    },
    {
      invalidateKeys: [queryKeys.partners.lists()],
      onSuccess: (created) => router.push(`/crm/partners/${created.id}`),
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
    onCancel: () => router.push('/crm/partners'),
  };
}
