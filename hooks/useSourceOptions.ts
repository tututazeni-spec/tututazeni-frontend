// hooks/useSourceOptions.ts
// Opções para associar uma fonte aprovada a uma sessão (Base de Conhecimento):
// em vez de escrever o ID, escolhe-se o curso, a lição, o documento ou o item
// da biblioteca pelo título. A validação final continua no backend.

import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';
import type { ComboboxOption } from '@/components/ui/Combobox';
import type { SourceType } from '@/components/avatar-training/types';

const PARAMS = { limit: 100 };

interface Titled {
  id: number | string;
  title: string;
}
interface Listed {
  data: Titled[];
}

const toOptions = (rows: Titled[] | undefined): ComboboxOption[] =>
  (rows ?? []).map((r) => ({ value: String(r.id), label: r.title }));

export function useSourceOptions(type: SourceType, courseId: string) {
  const opts = { staleTime: STALE_TIME.SEMI_STATIC };

  // Cursos: servem de fonte (COURSE) e de passo prévio para escolher a lição.
  const courses = useApiQuery<Listed>(
    ['avatar-training', 'source-options', 'courses'],
    '/courses',
    {
      params: PARAMS,
      enabled: type === 'COURSE' || type === 'LESSON',
      ...opts,
    },
  );
  const lessons = useApiQuery<{
    modules?: { lessons?: { id: number; title: string }[] }[];
  }>(
    ['avatar-training', 'source-options', 'lessons', courseId],
    `/courses/${courseId}`,
    { enabled: type === 'LESSON' && !!courseId, ...opts },
  );
  const documents = useApiQuery<Listed>(
    ['avatar-training', 'source-options', 'documents'],
    '/documents',
    { params: PARAMS, enabled: type === 'DOCUMENT', ...opts },
  );
  const library = useApiQuery<Listed>(
    ['avatar-training', 'source-options', 'library'],
    '/library/items',
    { params: PARAMS, enabled: type === 'LIBRARY_ITEM', ...opts },
  );

  const courseOptions = toOptions(courses.data?.data);
  const lessonOptions = toOptions(
    (lessons.data?.modules ?? []).flatMap((m) => m.lessons ?? []),
  );
  const items =
    type === 'COURSE'
      ? courseOptions
      : type === 'LESSON'
        ? lessonOptions
        : type === 'DOCUMENT'
          ? toOptions(documents.data?.data)
          : toOptions(library.data?.data);
  const loading =
    type === 'COURSE'
      ? courses.isLoading
      : type === 'LESSON'
        ? lessons.isLoading
        : type === 'DOCUMENT'
          ? documents.isLoading
          : library.isLoading;

  return { items, courseOptions, loading };
}
