// components/courses/GestaoView.tsx
// Vista "Gestão" (só ADMIN/RH): lista cursos DRAFT e ARCHIVED com as
// acções de ciclo de vida. Fecha o buraco entre CreateCourseModal (que
// cria SEMPRE em DRAFT, ver courses.controller.ts) e CatalogView (que só
// mostra status=PUBLISHED) — antes disto um curso criado pela UI não
// aparecia em ecrã nenhum e o toast mandava o utilizador para a aba
// Dashboard, que também não o listava.
//
// Endpoints (courses.controller.ts, todos @Roles(ADMIN, RH)):
//   GET   /courses?status=DRAFT|ARCHIVED   → catálogo filtrado + paginado
//   PATCH /courses/:id/publish             → 400 se _count.modules === 0
//   PATCH /courses/:id/archive
//   PUT   /courses/:id  { status: 'DRAFT' } → repor um curso arquivado

'use client';

import Link from 'next/link';
import { FileEdit, Layers } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COURSE_STATUS_MAP, Skeleton } from './shared';
import type { Course, PaginatedCourses } from './types';

interface GestaoViewProps {
  onSelect: (id: number) => void;
}

const DRAFT_PARAMS = { status: 'DRAFT', limit: 50 } as const;
const ARCHIVED_PARAMS = { status: 'ARCHIVED', limit: 50 } as const;

function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function GestaoView({ onSelect }: GestaoViewProps) {
  const confirm = useConfirm();
  const toast = useToast();

  const drafts = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(DRAFT_PARAMS),
    '/courses',
    { params: DRAFT_PARAMS, staleTime: STALE_TIME.DYNAMIC },
  );
  const archived = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(ARCHIVED_PARAMS),
    '/courses',
    { params: ARCHIVED_PARAMS, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.courses.all];
  const toastError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });

  const publish = useApiMutation(
    (id: number) => apiClient.patch(`/courses/${id}/publish`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({
          title: 'Curso publicado. Já aparece no catálogo.',
          intent: 'success',
        }),
      onError: toastError,
    },
  );
  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/courses/${id}/archive`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Curso arquivado.', intent: 'success' }),
      onError: toastError,
    },
  );
  const restore = useApiMutation(
    (id: number) => apiClient.put(`/courses/${id}`, { status: 'DRAFT' }),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Curso reposto como rascunho.', intent: 'success' }),
      onError: toastError,
    },
  );

  const rowBusy = (id: number) =>
    (publish.isPending && publish.variables === id) ||
    (archive.isPending && archive.variables === id) ||
    (restore.isPending && restore.variables === id);

  async function onArchive(c: Course) {
    const ok = await confirm({
      title: `Arquivar "${c.title}"?`,
      confirmLabel: 'Arquivar',
      destructive: true,
    });
    if (ok) archive.mutate(c.id);
  }

  if (drafts.isLoading || archived.isLoading) return <Skeleton rows={3} />;

  const draftList = drafts.data?.data ?? [];
  const archivedList = archived.data?.data ?? [];
  const someWithoutModules = draftList.some((c) => c._count.modules === 0);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">
          Rascunhos ({draftList.length})
        </h2>
        {draftList.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title="Sem rascunhos"
            description="Os cursos que crias aparecem aqui até serem publicados."
          />
        ) : (
          <Card className="divide-y divide-border">
            {draftList.map((c) => {
              const noModules = c._count.modules === 0;
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => onSelect(c.id)}
                  >
                    <div className="text-sm font-medium text-ink truncate">
                      {c.title}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {plural(c._count.modules, 'módulo', 'módulos')}
                      {c.category ? ` · ${c.category}` : ''}
                    </div>
                  </button>
                  <StatusBadge
                    value={c.status}
                    map={COURSE_STATUS_MAP}
                    variant="dot"
                    className="flex-shrink-0"
                  />
                  <Link
                    href={`/courses/modulos?courseId=${c.id}`}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-control border-[1.5px] border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-subtle"
                  >
                    <Layers size={14} strokeWidth={1.75} />
                    Gerir módulos
                  </Link>
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => onArchive(c)}
                    disabled={rowBusy(c.id)}
                  >
                    Arquivar
                  </Button>
                  <Button
                    intent="success"
                    size="sm"
                    onClick={() => publish.mutate(c.id)}
                    disabled={noModules || rowBusy(c.id)}
                    loading={publish.isPending && publish.variables === c.id}
                    title={
                      noModules
                        ? 'Adiciona pelo menos um módulo primeiro'
                        : undefined
                    }
                  >
                    Publicar
                  </Button>
                </div>
              );
            })}
          </Card>
        )}
        {someWithoutModules && (
          <p className="mt-2 text-xs text-ink-faint">
            Um curso só pode ser publicado depois de ter pelo menos um módulo.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">
          Arquivados ({archivedList.length})
        </h2>
        {archivedList.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title="Sem cursos arquivados"
            description="Podes repor um curso arquivado como rascunho a qualquer momento."
          />
        ) : (
          <Card className="divide-y divide-border">
            {archivedList.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => onSelect(c.id)}
                >
                  <div className="text-sm font-medium text-ink truncate">
                    {c.title}
                  </div>
                  <div className="text-xs text-ink-faint">
                    {plural(c._count.enrollments, 'matrícula', 'matrículas')}
                  </div>
                </button>
                <StatusBadge
                  value={c.status}
                  map={COURSE_STATUS_MAP}
                  variant="dot"
                  className="flex-shrink-0"
                />
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => restore.mutate(c.id)}
                  loading={restore.isPending && restore.variables === c.id}
                  disabled={rowBusy(c.id)}
                >
                  Repor como rascunho
                </Button>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
