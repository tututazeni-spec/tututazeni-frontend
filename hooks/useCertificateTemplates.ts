// hooks/useCertificateTemplates.ts
// Extraído de app/(platform)/certification/templates/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  EMPTY_TEMPLATE_FORM,
  type CreateTemplatePayload,
  type Template,
  type TemplateForm,
} from '@/components/certification/types';

export function useCertificateTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TemplateForm>(EMPTY_TEMPLATE_FORM);
  const notify = useToast();

  const {
    data = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<Template[]>(
    queryKeys.certification.templates(),
    '/certification/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const error = queryError?.message ?? '';

  const createMut = useApiMutation(
    () => {
      const payload: CreateTemplatePayload = {
        name: form.name,
        type: form.type,
        html: form.html,
        isDefault: form.isDefault,
      };
      if (form.description) payload.description = form.description;
      if (form.signatoryName) payload.signatoryName = form.signatoryName;
      if (form.signatoryTitle) payload.signatoryTitle = form.signatoryTitle;
      if (form.validityDays) payload.validityDays = Number(form.validityDays);
      return apiClient.post('/certification/templates', payload);
    },
    {
      invalidateKeys: [queryKeys.certification.templates()],
      onSuccess: () => {
        setShowForm(false);
        setForm(EMPTY_TEMPLATE_FORM);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );
  const saving = createMut.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    createMut.mutate(undefined);
  }

  return {
    data,
    loading,
    error,
    onRetry: () => refetch(),
    showForm,
    setShowForm,
    form,
    setForm,
    submit,
    saving,
  };
}
