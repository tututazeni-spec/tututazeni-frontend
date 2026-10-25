// components/courses-learn/useLessonPdf.ts
// Obtém o PDF de uma lição como object URL. PDFs carregados na plataforma não
// vêm no JSON da lição: pedem-se a GET /lessons/:id/file (cookie de sessão), e
// é o backend que decide se o utilizador pode vê-los. URLs http(s) externas
// passam directas.

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { LessonProgress } from './types';

export type LessonPdfState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'ready'; src: string }
  | { status: 'error'; message: string };

async function fetchPdf(lessonId: number): Promise<Blob> {
  const res = await apiClient.getRaw(`/lessons/${lessonId}/file`, {
    headers: { Accept: 'application/pdf' },
    errorMessage: 'Não foi possível abrir o PDF desta aula.',
  });
  return res.blob();
}

export function useLessonPdf(
  lesson: Pick<LessonProgress, 'id' | 'contentUrl' | 'hasFile'>,
): LessonPdfState {
  const external = /^https?:/i.test(lesson.contentUrl ?? '')
    ? lesson.contentUrl
    : null;
  const needsFetch = !external && lesson.hasFile;
  const [state, setState] = useState<LessonPdfState>({ status: 'none' });

  useEffect(() => {
    if (external) {
      setState({ status: 'ready', src: external });
      return;
    }
    if (!needsFetch) {
      setState({ status: 'none' });
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setState({ status: 'loading' });
    fetchPdf(lesson.id)
      .then((blob) => {
        if (cancelled) return;
        // Garante o tipo mesmo que o servidor responda com outro.
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: 'application/pdf' }),
        );
        setState({ status: 'ready', src: objectUrl });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Falha ao abrir o PDF.',
        });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [lesson.id, external, needsFetch]);

  return state;
}
