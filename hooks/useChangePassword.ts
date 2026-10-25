// hooks/useChangePassword.ts
// Formulário «Alterar senha» (POST /auth/change-password).
// Extraído de components/settings/TabSeguranca.tsx.

'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useApiMutation } from './useApiQuery';
import {
  EMPTY_PASSWORD_FORM,
  passwordStrength,
  passwordTips,
  passwordsMismatch,
  validateNewPassword,
  type PasswordFormValues,
  type ToastFn,
} from '@/components/settings/seguranca/logic';

export function useChangePassword(toastFn: ToastFn) {
  const [form, setForm] = useState<PasswordFormValues>(EMPTY_PASSWORD_FORM);
  const [showPass, setShowPass] = useState(false);

  // ChangePasswordDto: { currentPassword, newPassword }
  const changePassword = useApiMutation(
    (payload: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/auth/change-password', payload),
    {
      onSuccess: () => {
        toastFn('Senha alterada com sucesso!', 'success');
        setForm(EMPTY_PASSWORD_FORM);
      },
      onError: (e) => toastFn(e.message ?? 'Erro ao alterar senha', 'error'),
    },
  );

  const set = (k: keyof PasswordFormValues, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateNewPassword(form);
    if (problem) {
      toastFn(problem, 'error');
      return;
    }
    changePassword.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };

  return {
    form,
    set,
    showPass,
    toggleShowPass: () => setShowPass((s) => !s),
    submit,
    saving: changePassword.isPending,
    strength: passwordStrength(form.newPassword),
    tips: passwordTips(form.newPassword),
    mismatch: passwordsMismatch(form),
  };
}

export type ChangePasswordController = ReturnType<typeof useChangePassword>;
