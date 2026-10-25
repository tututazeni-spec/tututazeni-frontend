// hooks/useProgramForm.ts
// Formulário de criação/edição de uma formação com avatar: estado, as cinco
// queries de apoio (avatares, cursos, módulos, departamentos, competências) e
// a gravação. Extraído de components/avatar-training/ProgramsTab.tsx, onde o
// modal tinha ~20 useState soltos.

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useUserOptions } from '@/components/avatar-training/useUserOptions';
import {
  ALL,
  addObjective,
  avatarItems,
  buildProgramPayload,
  canSaveProgram,
  chooseCategory,
  chooseCourse,
  chooseLanguage,
  initialProgramForm,
  isDurationInvalid,
  isMinScoreInvalid,
  variantItems,
  type ProgramFormValues,
} from '@/components/avatar-training/programs/logic';
import type {
  AvatarProgramDetail,
  TrainingAvatar,
} from '@/components/avatar-training/types';

const COURSE_PARAMS = { limit: 100 };
const DEPT_PARAMS = { limit: 200 };

export function useProgramForm(
  program: AvatarProgramDetail | undefined,
  onSaved: () => void,
  onClose: () => void,
) {
  const notify = useToast();
  const users = useUserOptions();
  const [form, setForm] = useState<ProgramFormValues>(() =>
    initialProgramForm(program),
  );
  const [customObjective, setCustomObjective] = useState('');
  const set = (patch: Partial<ProgramFormValues>) =>
    setForm((f) => ({ ...f, ...patch }));

  const avatars = useApiQuery<TrainingAvatar[]>(
    queryKeys.avatarTraining.avatars(),
    '/avatar-training/avatars',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  // Módulos do curso escolhido (o detalhe do curso traz-os).
  const courseDetail = useApiQuery<{
    modules?: { id: number; title: string }[];
  }>(
    ['avatar-training', 'course-modules', form.courseId],
    `/courses/${form.courseId}`,
    { enabled: form.courseId !== ALL, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const courses = useApiQuery<{ data: { id: number; title: string }[] }>(
    queryKeys.courses.list(COURSE_PARAMS),
    '/courses',
    { params: COURSE_PARAMS, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(DEPT_PARAMS),
    '/departments',
    { params: DEPT_PARAMS, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const comps = useApiQuery<{ data: { id: number; name: string }[] }>(
    ['avatar-training', 'competency-options'],
    '/competencies',
    { params: { limit: 100 }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const courseOptions = (courses.data?.data ?? []).map((c) => ({
    id: c.id,
    label: c.title,
  }));
  const moduleOptions =
    form.courseId === ALL ? [] : (courseDetail.data?.modules ?? []);

  const save = useApiMutation(
    () => {
      const body = buildProgramPayload(form);
      return program
        ? apiClient.patch(`/avatar-training/programs/${program.id}`, body)
        : apiClient.post('/avatar-training/programs', body);
    },
    {
      invalidateKeys: [queryKeys.avatarTraining.all],
      onSuccess: () => {
        notify({
          title: program ? 'Formação actualizada' : 'Formação criada',
          intent: 'success',
        });
        onSaved();
        onClose();
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível guardar a formação',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return {
    form,
    set,
    changeCategory: (v: string) => setForm((f) => chooseCategory(f, v)),
    changeLanguage: (v: string) => setForm((f) => chooseLanguage(f, v)),
    changeCourse: (v: string) => setForm((f) => chooseCourse(f, v)),

    customObjective,
    setCustomObjective,
    addCustomObjective: () => {
      set({ objectives: addObjective(form.objectives, customObjective) });
      setCustomObjective('');
    },

    users,
    courseOptions,
    moduleOptions,
    deptOptions: (depts.data?.data ?? []).map((d) => ({
      id: d.id,
      label: d.name,
    })),
    competencyOptions: (comps.data?.data ?? []).map((c) => ({
      id: c.id,
      label: c.name,
    })),
    avatarItems: avatarItems(avatars.data ?? [], form.avatarId),
    variantItems: variantItems(form.language, form.variant),

    durationInvalid: isDurationInvalid(form.duration),
    minScoreInvalid: isMinScoreInvalid(form.minScore),
    canSave: canSaveProgram(form),
    save: () => save.mutate(undefined),
    isSaving: save.isPending,
  };
}

export type ProgramFormController = ReturnType<typeof useProgramForm>;
