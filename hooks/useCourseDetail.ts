// hooks/useCourseDetail.ts
// Container da vista de detalhe de curso + player — queries de curso/
// progresso, auto-selecção da 1ª aula incompleta, e as 3 mutações
// (matricular, marcar aula concluída, enviar feedback). Extraído de
// CourseDetail em app/(platform)/courses/page.tsx (437 linhas, misturava
// isto com o JSX do player/header/módulos/feedback).
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  CourseDetailData,
  CourseProgress,
  Lesson,
} from '@/components/courses/types';
import type { ModuleProgress } from '@/components/courses-learn/types';

export function useCourseDetail(courseId: number) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const notify = useToast();

  // course e progress em paralelo. O progress dá 4xx quando não inscrito → o RQ
  // não repete 4xx; tratamos a ausência como "não inscrito" (progress = null).
  const { data: course, isLoading: loadingCourse } =
    useApiQuery<CourseDetailData>(
      queryKeys.courses.detail(courseId),
      `/courses/${courseId}`,
      { staleTime: STALE_TIME.SEMI_STATIC },
    );
  const { data: progress = null } = useApiQuery<CourseProgress>(
    queryKeys.courses.progress(courseId),
    `/courses/${courseId}/progress`,
    { staleTime: STALE_TIME.DYNAMIC, retry: false },
  );

  // /courses/:id/progress só traz o resumo das aulas (sem contentUrl/textContent).
  // O conteúdo para o leitor vem de /module-progress — chave própria, porque
  // a de progress(courseId) guarda o formato do resumo.
  const isEnrolledEarly =
    !!progress?.enrollment && progress.enrollment.status !== 'PENDING_APPROVAL';
  const moduleProgressKey = [
    ...queryKeys.courses.all,
    'module-progress',
    courseId,
  ];
  const { data: contentModules, isLoading: loadingLessonContent } = useApiQuery<
    ModuleProgress[]
  >(
    moduleProgressKey,
    `/courses/${courseId}/module-progress`,
    { enabled: isEnrolledEarly, staleTime: STALE_TIME.DYNAMIC },
  );
  const lessonModule = useMemo(
    () =>
      activeLesson
        ? (contentModules?.find((m) =>
            m.lessons.some((l) => l.id === activeLesson.id),
          ) ?? null)
        : null,
    [contentModules, activeLesson],
  );
  const lessonContent =
    lessonModule?.lessons.find((l) => l.id === activeLesson?.id) ?? null;

  // Auto-selecciona a 1ª aula incompleta quando o progresso chega.
  useEffect(() => {
    if (!progress || activeLesson) return;
    for (const mod of progress.modules ?? []) {
      const pending = mod.lessons.find((l: Lesson) => !l.completed);
      if (pending) {
        setActiveLesson(pending);
        break;
      }
    }
  }, [progress, activeLesson]);

  const enroll = useApiMutation(
    () => apiClient.post(`/courses/${courseId}/enroll`, {}),
    {
      invalidateKeys: [
        queryKeys.courses.detail(courseId),
        queryKeys.courses.progress(courseId),
        queryKeys.courses.myEnrollments(),
      ],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const markComplete = useApiMutation(
    (lessonId: number) =>
      apiClient.post(`/courses/lessons/${lessonId}/complete`, {}),
    {
      invalidateKeys: [
        queryKeys.courses.progress(courseId),
        queryKeys.courses.detail(courseId),
        moduleProgressKey,
      ],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const feedback = useApiMutation(
    () => apiClient.post(`/courses/${courseId}/feedback`, { rating, comment }),
    {
      invalidateKeys: [queryKeys.courses.detail(courseId)],
      onSuccess: () => {
        notify({ title: 'Obrigado pelo feedback!', intent: 'success' });
        setRating(0);
        setComment('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleEnroll = () => enroll.mutate(undefined);
  const handleMarkComplete = () => {
    if (activeLesson) markComplete.mutate(activeLesson.id);
  };
  const handleFeedback = () => {
    if (rating) feedback.mutate(undefined);
  };

  const isEnrolled = !!progress?.enrollment;
  const progressPct = progress?.courseProgress?.pct ?? 0;

  return {
    course,
    loadingCourse,
    progress,
    isEnrolled,
    progressPct,
    activeLesson,
    lessonContent,
    lessonModule,
    loadingLessonContent,
    setActiveLesson,
    rating,
    setRating,
    comment,
    setComment,
    handleEnroll,
    handleMarkComplete,
    handleFeedback,
    enrolling: enroll.isPending,
    completing: markComplete.isPending,
    feedbackLoading: feedback.isPending,
  };
}
