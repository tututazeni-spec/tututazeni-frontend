// hooks/useCreateInternalAudit.ts
// Estado e submissão do formulário «Nova auditoria» (POST /audit/audits).
// Extraído de components/audit/AuditsView.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from './useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import type { DirectoryUser } from '@/components/users/types';
import {
  EMPTY_NEW_AUDIT_FORM,
  buildCreateAuditPayload,
  validateNewAudit,
  type NewAuditFormValues,
} from '@/components/audit/audits/logic';

export function useCreateInternalAudit(onCreated: () => void) {
  const notify = useToast();
  const [form, setForm] = useState<NewAuditFormValues>(EMPTY_NEW_AUDIT_FORM);
  const [lead, setLead] = useState<DirectoryUser | null>(null);
  const [team, setTeam] = useState<DirectoryUser[]>([]);
  const [member, setMember] = useState<DirectoryUser | null>(null);
  const [error, setError] = useState('');

  const set = (patch: Partial<NewAuditFormValues>) =>
    setForm((f) => ({ ...f, ...patch }));

  /** Escolher alguém no selector junta-o à equipa (sem duplicados). */
  const pickMember = (u: DirectoryUser | null) => {
    if (u && !team.some((t) => t.id === u.id)) setTeam((t) => [...t, u]);
    setMember(null);
  };
  const removeMember = (id: number) =>
    setTeam((l) => l.filter((x) => x.id !== id));

  const create = useApiMutation(
    () =>
      apiClient.post(
        '/audit/audits',
        buildCreateAuditPayload(
          form,
          lead?.id,
          team.map((t) => t.id),
        ),
      ),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: () => {
        notify({ title: 'Auditoria criada', intent: 'success' });
        onCreated();
      },
      onError: (e) => setError(e.message),
    },
  );

  const submit = () => {
    const problem = validateNewAudit(form);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    create.mutate(undefined);
  };

  return {
    form,
    set,
    lead,
    setLead,
    team,
    member,
    pickMember,
    removeMember,
    error,
    submit,
    isPending: create.isPending,
  };
}

export type CreateInternalAuditController = ReturnType<
  typeof useCreateInternalAudit
>;
