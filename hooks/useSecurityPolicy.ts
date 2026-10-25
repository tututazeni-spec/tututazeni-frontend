// hooks/useSecurityPolicy.ts
// Política de segurança da organização (ADMIN): /settings/security/policy.
// Extraído de components/settings/TabSeguranca.tsx.

'use client';

import type { FormEvent } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useServerDraft } from './useServerDraft';
import type { ToastFn } from '@/components/settings/seguranca/logic';
import type {
  SecurityPolicy,
  TwoFactorMode,
} from '@/components/settings/types';

export function useSecurityPolicy(toastFn: ToastFn) {
  const query = useApiQuery<
    SecurityPolicy & { twoFactorModes: TwoFactorMode[] }
  >(queryKeys.settings.securityPolicy(), '/settings/security/policy');
  const [form, setForm] = useServerDraft<SecurityPolicy>(query.data);

  const save = useApiMutation(
    (payload: SecurityPolicy) =>
      apiClient.put('/settings/security/policy', payload),
    {
      invalidateKeys: [queryKeys.settings.securityPolicy()],
      onSuccess: () => toastFn('Política de segurança guardada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  const set = (k: keyof SecurityPolicy, v: number | boolean | string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  const num = (k: keyof SecurityPolicy) => (form?.[k] as number) ?? 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form) save.mutate(form);
  };

  return {
    /** Sem dados ainda: a vista não mostra nada. */
    ready: !query.isLoading && !!form,
    form,
    set,
    num,
    submit,
    twoFactorModes: query.data?.twoFactorModes ?? [],
    saving: save.isPending,
  };
}

export type SecurityPolicyController = ReturnType<typeof useSecurityPolicy>;
