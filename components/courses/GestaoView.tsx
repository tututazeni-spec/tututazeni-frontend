// components/courses/GestaoView.tsx
// Aba "Cursos" para ADMIN/RH (docs/modulo_courses.md secção 2) — tabela
// única com filtros e acções de gestão, montada em vez de CatalogView
// quando o utilizador é admin (ver app/(platform)/courses/page.tsx).
// Substitui a antiga vista agrupada por estado (rascunhos/publicados/em
// pausa/arquivados em secções separadas) por uma tabela filtrável com
// coluna "Estado", mais fiel à tabela pedida pelo doc.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Building2,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ModuleModal } from '@/components/courses-modulos/ModuleModal';
import { EnrollUserModal } from '@/components/enrollments/EnrollUserModal';
import { useDepartmentOptions } from '@/components/enrollments/enrollData';
import { CourseListCard } from './CourseListCard';
import { EditCourseModal } from './EditCourseModal';
import { PendingEnrollmentsModal } from './PendingEnrollmentsModal';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { ShortcutPills } from '@/components/ui/Pills';
import { RecycleBinView } from './RecycleBinView';
import { Select } from '@/components/ui/Select';
import { COURSE_MODALITY_LABELS, COURSE_TYPE_LABELS, Skeleton } from './shared';
import type { Course, PaginatedCourses } from './types';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'PAUSED', label: 'Em pausa' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  ...Object.entries(COURSE_MODALITY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

interface GestaoViewProps {
  onSelect: (id: number) => void;
  onManageModules?: (courseId: number) => void;
  /** Muda a página de Cursos para a aba "Inscrições" pré-filtrada por este
   *  curso — acções "Ver inscrições"/"Ver progresso" (secção 2, "Ações"). */
  onViewEnrollments?: (courseId: number) => void;
}

export function GestaoView({
  onSelect,
  onManageModules,
  onViewEnrollments,
}: GestaoViewProps) {
  const confirm = useConfirm();
  const toast = useToast();
  // Espelha @Roles(ADMIN, RH) de DELETE /courses/:id.
  const canDelete = useHasRole(ADMIN_ROLES);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    type: '',
    modality: '',
    departmentId: '',
    page: 1,
  });
  const [showRecycle, setShowRecycle] = useState(false);
  const [addModuleFor, setAddModuleFor] = useState<number | null>(null);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [pendingFor, setPendingFor] = useState<Course | null>(null);
  const [enrollFor, setEnrollFor] = useState<number | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    search: filters.search || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
    type: filters.type || undefined,
    modality: filters.modality || undefined,
    departmentId: filters.departmentId || undefined,
  };

  const { data, isLoading } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(params),
    '/courses',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  const { data: cats = [] } = useApiQuery<
    Array<{ category: string; count: number }>
  >(queryKeys.courses.categories(), '/courses/categories', {
    staleTime: STALE_TIME.STATIC,
  });
  const categoryItems = [
    { value: 'ALL', label: 'Todas as categorias' },
    ...cats
      .map((c) => c.category)
      .filter(Boolean)
      .map((c) => ({ value: c as string, label: c as string })),
  ];

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
  // Sem endpoint dedicado para pausar/retomar/despublicar (só /publish e
  // /archive têm regras de negócio próprias) — mudança de estado directa.
  const pause = useApiMutation(
    (id: number) => apiClient.put(`/courses/${id}`, { status: 'PAUSED' }),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Curso despublicado (em pausa).', intent: 'success' }),
      onError: toastError,
    },
  );
  const resume = useApiMutation(
    (id: number) => apiClient.put(`/courses/${id}`, { status: 'PUBLISHED' }),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Curso retomado.', intent: 'success' }),
      onError: toastError,
    },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/courses/${id}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({
          title:
            'Curso movido para a reciclagem. Podes restaurá-lo durante 30 dias.',
          intent: 'success',
        }),
      onError: toastError,
    },
  );
  const duplicate = useApiMutation(
    (id: number) => apiClient.post(`/courses/${id}/duplicate`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Curso duplicado como rascunho.', intent: 'success' }),
      onError: toastError,
    },
  );

  const rowBusy = (id: number) =>
    [publish, archive, restore, pause, resume, remove, duplicate].some(
      (m) => m.isPending && m.variables === id,
    );

  async function onArchive(c: Course) {
    const ok = await confirm({
      title: `Arquivar "${c.title}"?`,
      confirmLabel: 'Arquivar',
      destructive: true,
    });
    if (ok) archive.mutate(c.id);
  }
  async function onDelete(c: Course) {
    const ok = await confirm({
      title: `Eliminar "${c.title}"?`,
      message:
        'Vai para a reciclagem e pode ser restaurado durante 30 dias. Depois é apagado em definitivo.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(c.id);
  }

  const courses = data?.data ?? [];

  if (showRecycle) {
    return (
      <div>
        <ShortcutPills
          className="mb-4"
          items={[
            {
              label: '← Voltar aos cursos',
              onClick: () => setShowRecycle(false),
            },
          ]}
        />
        <RecycleBinView />
      </div>
    );
  }

  return (
    <div>
      {/* Filtros — grid de largura uniforme (8 campos: 2 pesquisas + 6
          selects, em 1/2/3 colunas; departamentos ocupa 2 no ecrã largo para o texto caber sem ser cortado) em vez de larguras w-* ad-hoc por campo, para que todos
          os controlos fiquem com o mesmo tamanho e alinhados em colunas. */}
      {/* Painel de filtros: Card + CardBody (padrão do separador Relatórios do roi-impact) */}
      <Card className="mb-5">
        <CardBody>
          {/* Design dos filtros: ícone + linha por baixo; 3 colunas na 1.ª linha,
              modalidades (1/3) + estados (2/3) na 2.ª e departamentos na 3.ª. */}
          <div className="mb-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-6">
            <SearchInput
              variant="underline"
              placeholder="Pesquisar cursos…"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="lg:col-span-2"
            />
            <Select
              variant="underline"
              icon={LayoutGrid}
              items={categoryItems}
              value={filters.category || 'ALL'}
              onValueChange={(v) =>
                updateFilters({ category: v === 'ALL' ? '' : v })
              }
              className="lg:col-span-2"
            />
            <Select
              variant="underline"
              icon={Filter}
              items={TYPE_ITEMS}
              value={filters.type || 'ALL'}
              onValueChange={(v) =>
                updateFilters({ type: v === 'ALL' ? '' : v })
              }
              className="lg:col-span-2"
            />
            <Select
              variant="underline"
              icon={List}
              items={MODALITY_ITEMS}
              value={filters.modality || 'ALL'}
              onValueChange={(v) =>
                updateFilters({ modality: v === 'ALL' ? '' : v })
              }
              className="lg:col-span-2"
            />
            <Select
              variant="underline"
              icon={MapPin}
              items={STATUS_ITEMS}
              value={filters.status || 'ALL'}
              onValueChange={(v) =>
                updateFilters({ status: v === 'ALL' ? '' : v })
              }
              className="lg:col-span-4"
            />
            <Select
              variant="underline"
              icon={Building2}
              items={[
                { value: 'ALL', label: 'Todos os departamentos' },
                ...departmentOptions,
              ]}
              value={filters.departmentId || 'ALL'}
              onValueChange={(v) =>
                updateFilters({ departmentId: v === 'ALL' ? '' : v })
              }
              className="sm:col-span-2 lg:col-span-6"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <ShortcutPills
              items={[
                { label: 'Reciclagem', onClick: () => setShowRecycle(true) },
              ]}
            />
            <span className="text-sm text-ink">{data?.total ?? 0} cursos</span>
          </div>
        </CardBody>
      </Card>

      {isLoading && <Skeleton rows={4} />}

      {!isLoading && courses.length === 0 && (
        <EmptyState
          title="Nenhum curso encontrado"
          description="Ajusta os filtros ou cria um novo curso."
        />
      )}

      {!isLoading && courses.length > 0 && (
        <div>
          <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...courses]
              .sort((x, y) => x.id - y.id)
              .map((c) => {
                const noModules = c._count.modules === 0;
                return (
                  <CourseListCard
                    key={c.id}
                    courseId={c.id}
                    course={{
                      ...c,
                      primaryInstructor: c.primaryInstructor ?? null,
                    }}
                    mandatory={c.mandatory}
                    progress={Math.round(c.avgProgress ?? 0)}
                    progressLabel="Progresso médio"
                    onSelect={() => onSelect(c.id)}
                    actions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-control p-1.5 text-on-brand-muted hover:bg-white/10 hover:text-white disabled:opacity-50"
                            disabled={rowBusy(c.id)}
                          >
                            <MoreHorizontal size={16} strokeWidth={1.75} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onSelect(c.id)}>
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setEditCourseId(c.id)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => duplicate.mutate(c.id)}
                          >
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {c.status === 'DRAFT' && (
                            <DropdownMenuItem
                              disabled={noModules}
                              onSelect={() => publish.mutate(c.id)}
                            >
                              Publicar
                            </DropdownMenuItem>
                          )}
                          {c.status === 'PUBLISHED' && (
                            <DropdownMenuItem
                              onSelect={() => pause.mutate(c.id)}
                            >
                              Despublicar
                            </DropdownMenuItem>
                          )}
                          {c.status === 'PAUSED' && (
                            <DropdownMenuItem
                              onSelect={() => resume.mutate(c.id)}
                            >
                              Retomar
                            </DropdownMenuItem>
                          )}
                          {c.status === 'ARCHIVED' ? (
                            <DropdownMenuItem
                              onSelect={() => restore.mutate(c.id)}
                            >
                              Repor rascunho
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => onArchive(c)}>
                              Arquivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEnrollFor(c.id)}>
                            Inscrever colaboradores
                          </DropdownMenuItem>
                          {onViewEnrollments && (
                            <DropdownMenuItem
                              onSelect={() => onViewEnrollments(c.id)}
                            >
                              Ver inscrições / progresso
                            </DropdownMenuItem>
                          )}
                          {onManageModules && (
                            <DropdownMenuItem
                              onSelect={() => onManageModules(c.id)}
                            >
                              Gerir módulos
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={() => setAddModuleFor(c.id)}
                          >
                            <Plus
                              size={14}
                              strokeWidth={1.75}
                              className="mr-1 inline"
                            />
                            Adicionar módulo
                          </DropdownMenuItem>
                          {c.requiresApproval && (
                            <DropdownMenuItem onSelect={() => setPendingFor(c)}>
                              Pedidos de inscrição
                            </DropdownMenuItem>
                          )}
                          {canDelete &&
                            !(
                              c.status === 'PUBLISHED' &&
                              c._count.enrollments > 0
                            ) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-danger-ink"
                                  onSelect={() => onDelete(c)}
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                );
              })}
          </div>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              ← Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={filters.page === data.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Próxima →
            </Button>
          </div>
        </div>
      )}

      {addModuleFor !== null && (
        <ModuleModal
          courseId={addModuleFor}
          editing={null}
          otherModules={[]}
          onClose={() => setAddModuleFor(null)}
          onSaved={() =>
            toast({
              title: 'Módulo adicionado. Já podes publicar o curso.',
              intent: 'success',
            })
          }
        />
      )}

      {editCourseId !== null && (
        <EditCourseModal
          courseId={editCourseId}
          onClose={() => setEditCourseId(null)}
          onSuccess={() =>
            toast({ title: 'Curso actualizado.', intent: 'success' })
          }
        />
      )}

      {pendingFor && (
        <PendingEnrollmentsModal
          courseId={pendingFor.id}
          courseTitle={pendingFor.title}
          onClose={() => setPendingFor(null)}
        />
      )}

      {enrollFor !== null && (
        <EnrollUserModal
          initialCourseId={enrollFor}
          onClose={() => setEnrollFor(null)}
        />
      )}
    </div>
  );
}
