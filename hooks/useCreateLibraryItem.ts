// hooks/useCreateLibraryItem.ts
// Extraído de app/(platform)/library/novo/page.tsx.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import type { LibraryItemPayload } from '@/components/library/types';

const INITIAL_FORM = {
  type: 'PDF',
  title: '',
  subtitle: '',
  description: '',
  fileUrl: '',
  author: '',
  publisher: '',
  isbn: '',
  year: '',
  language: 'pt',
  pages: '',
  categoriesText: '',
  keywordsText: '',
};

export function useCreateLibraryItem() {
  const router = useRouter();

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(INITIAL_FORM, {
    title: [required()],
    fileUrl: [required()],
  });
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createMut = useApiMutation(
    () => {
      const payload: LibraryItemPayload = {
        type: form.type,
        title: form.title,
        fileUrl: form.fileUrl,
        language: form.language,
      };
      if (form.subtitle) payload.subtitle = form.subtitle;
      if (form.description) payload.description = form.description;
      if (form.author) payload.author = form.author;
      if (form.publisher) payload.publisher = form.publisher;
      if (form.isbn) payload.isbn = form.isbn;
      if (form.year) payload.year = Number(form.year);
      if (form.pages) payload.pages = Number(form.pages);
      if (form.categoriesText)
        payload.categories = form.categoriesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      if (form.keywordsText)
        payload.keywords = form.keywordsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      return apiClient.post<{ id: string }>('/library/items', payload);
    },
    {
      invalidateKeys: [queryKeys.library.all],
      onSuccess: (created) => router.push(`/library/${created.id}`),
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
    onCancel: () => router.push('/library'),
  };
}
