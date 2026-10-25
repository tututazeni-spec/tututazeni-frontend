// hooks/useSessionBuilder.ts
// Estado e gravação do Construtor de Sessões (docs/Avatar_Training.md §7):
// dados da sessão, lista de etapas e regras de falha.
// Extraído de components/avatar-training/BuilderTab.tsx (SessionForm).

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation } from './useApiQuery';
import {
  addStep,
  buildSessionPayload,
  canSaveSession,
  moveStep,
  patchStep,
  removeStep,
} from '@/components/avatar-training/builder/logic';
import type {
  BuilderStep,
  ExperienceType,
  SessionDetail,
  SessionRules,
} from '@/components/avatar-training/types';

interface SessionFields {
  title: string;
  welcome: string;
  duration: string;
  experienceType: ExperienceType;
}

export function useSessionBuilder(session: SessionDetail) {
  const notify = useToast();
  const [fields, setFields] = useState<SessionFields>({
    title: session.title,
    welcome: session.welcomeMessage ?? '',
    duration: session.durationMinutes ? String(session.durationMinutes) : '',
    experienceType: session.experienceType,
  });
  const [steps, setSteps] = useState<BuilderStep[]>(session.steps);
  const [rules, setRules] = useState<SessionRules>(session.rules ?? {});

  const save = useApiMutation(
    () =>
      apiClient.patch(
        `/avatar-training/sessions/${session.id}`,
        buildSessionPayload({ ...fields, steps, rules }),
      ),
    {
      invalidateKeys: [
        queryKeys.avatarTraining.session(session.id),
        queryKeys.avatarTraining.sessions(),
      ],
      onSuccess: () => notify({ title: 'Sessão guardada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível guardar a sessão',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return {
    session,
    ...fields,
    setFields: (patch: Partial<SessionFields>) =>
      setFields((f) => ({ ...f, ...patch })),
    steps,
    rules,
    setRules,
    patchStep: (i: number, p: Partial<BuilderStep>) =>
      setSteps((s) => patchStep(s, i, p)),
    moveStep: (i: number, dir: -1 | 1) => setSteps((s) => moveStep(s, i, dir)),
    removeStep: (i: number) => setSteps((s) => removeStep(s, i)),
    addStep: () => setSteps(addStep),
    canSave: canSaveSession({ title: fields.title, steps }),
    save: () => save.mutate(undefined),
    isSaving: save.isPending,
  };
}

export type SessionBuilderController = ReturnType<typeof useSessionBuilder>;
