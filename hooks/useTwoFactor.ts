// hooks/useTwoFactor.ts
// 2FA pessoal: estado, configuração, ativação e desativação
// (/settings/security/me/2fa). Extraído de components/settings/TabSeguranca.tsx.

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from './useApiQuery';
import {
  isTotpCodeComplete,
  type ToastFn,
} from '@/components/settings/seguranca/logic';
import type { TwoFactorStatus } from '@/components/settings/types';

interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export function useTwoFactor(toastFn: ToastFn) {
  const status = useApiQuery<TwoFactorStatus>(
    queryKeys.settings.twoFactor(),
    '/settings/security/me/2fa',
  );
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');

  const setupMutation = useApiMutation(
    () => apiClient.post<TwoFactorSetup>('/settings/security/me/2fa/setup', {}),
    {
      onSuccess: (data) => setSetup(data),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );
  const enableMutation = useApiMutation(
    (c: string) =>
      apiClient.post('/settings/security/me/2fa/enable', { code: c }),
    {
      invalidateKeys: [queryKeys.settings.twoFactor()],
      onSuccess: () => {
        setSetup(null);
        setCode('');
        toastFn('2FA activado com sucesso', 'success');
      },
      onError: (e) => toastFn(e.message, 'error'),
    },
  );
  const disableMutation = useApiMutation(
    (c: string) =>
      apiClient.post('/settings/security/me/2fa/disable', { code: c }),
    {
      invalidateKeys: [queryKeys.settings.twoFactor()],
      onSuccess: () => {
        setCode('');
        toastFn('2FA desactivado', 'success');
      },
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  return {
    isLoading: status.isLoading,
    enabled: status.data?.enabled ?? false,
    mode: status.data?.mode,
    setup,
    code,
    setCode,
    codeComplete: isTotpCodeComplete(code),
    startSetup: () => setupMutation.mutate(undefined),
    cancelSetup: () => setSetup(null),
    enable: () => enableMutation.mutate(code),
    disable: () => disableMutation.mutate(code),
    pending: {
      setup: setupMutation.isPending,
      enable: enableMutation.isPending,
      disable: disableMutation.isPending,
    },
  };
}

export type TwoFactorController = ReturnType<typeof useTwoFactor>;
