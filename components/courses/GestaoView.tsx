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
import { MoreHorizontal, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ModuleModal } from '@/components/courses-modulos/ModuleModal';
import { EnrollUserModal } from '@/components/enrollments/EnrollUserModal';
import { useDepartmentOptions } from '@/components/enrollments/enrollData';
import { EditCourseModal } from './EditCourseModal';
import { PendingEnrollmentsModal } from './PendingEnrollmentsModal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  COURSE_MODALITY_LABELS,
  COURSE_STATUS_MAP,
  COURSE_TYPE_LABELS,
  fmtDuration,
  Skeleton,
} from './shared';
import type { Course, PaginatedCourses } from './types';

const LEVEL_ITEMS = [
  { value: 'ALL', label: 'Todos os níveis' },
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'PAUSED', label: 'Em pausa' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  ...Object.entries(COURSE_MODALITY_LABELS).map(([value, label]) => ({ value, label })),
];

interface GestaoViewProps {
  onSelect: (id: number) => void;
  onManageModules?: (courseId: number) => void;
  /** Muda a página de Cursos para a aba "Inscrições" pré-filtrada por este
   *  curso — acções "Ver inscrições"/"Ver progresso" (secção 2, "Ações"). */
  onViewEnrollments?: (courseId: number) => void;
}

export function GestaoView({ onSelect, onManageModules, onViewEnrollments }: GestaoViewProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    status: '',
    type: '',
    modality: '',
    departmentId: '',
    unit: '',
    page: 1,
  });
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
    level: filters.level || undefined,
    status: filters.status || undefined,
    type: filters.type || undefined,
    modality: filters.modality || undefined,
    departmentId: filters.departmentId || undefined,
    unit: filters.unit || undefined,
  };

  const { data, isLoading } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(params),
    '/courses',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const { data: cats = [] } = useApiQuery<Array<{ category: string; count: number }>>(
    queryKeys.courses.categories(),
    '/courses/categories',
    { staleTime: STALE_TIME.STATIC },
  );
  const categoryItems = [
    { value: 'ALL', label: 'Todas as categorias' },
    ...cats.map((c) => c.category).filter(Boolean).map((c) => ({ value: c as string, label: c as string })),
  ];

  const invalidateKeys = [queryKeys.courses.all];
  const toastError = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const publish = useApiMutation((id: number) => apiClient.patch(`/courses/${id}/publish`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Curso publicado. Já aparece no catálogo.', intent: 'success' }),
    onError: toastError,
  });
  const archive = useApiMutation((id: number) => apiClient.patch(`/courses/${id}/archive`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Curso arquivado.', intent: 'success' }),
    onError: toastError,
  });
  const restore = useApiMutation(
    (id: number) => apiClient.put(`/courses/${id}`, { status: 'DRAFT' }),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Curso reposto como rascunho.', intent: 'success' }),
      onError: toastError,
    },
  );
  // Sem endpoint dedicado para pausar/retomar/despublicar (só /publish e
  // /archive têm regras de negócio próprias) — mudança de estado directa.
  const pause = useApiMutation((id: number) => apiClient.put(`/courses/${id}`, { status: 'PAUSED' }), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Curso despublicado (em pausa).', intent: 'success' }),
    onError: toastError,
  });
  const resume = useApiMutation((id: number) => apiClient.put(`/courses/${id}`, { status: 'PUBLISHED' }), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Curso retomado.', intent: 'success' }),
    onError: toastError,
  });
  const remove = useApiMutation((id: number) => apiClient.delete(`/courses/${id}`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Curso eliminado.', intent: 'success' }),
    onError: toastError,
  });
  const duplicate = useApiMutation((id: number) => apiClient.post(`/courses/${id}/duplicate`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Curso duplicado como rascunho.', intent: 'success' }),
    onError: toastError,
  });

  const rowBusy = (id: number) =>
    [publish, archive, restore, pause, resume, remove, duplicate].some(
      (m) => m.isPending && m.variables === id,
    );

  async function onArchive(c: Course) {
    const ok = await confirm({ title: `Arquivar "${c.title}"?`, confirmLabel: 'Arquivar', destructive: true });
    if (ok) archive.mutate(c.id);
  }
  async function onDelete(c: Course) {
    const ok = await confirm({ title: `Eliminar "${c.title}"?`, confirmLabel: 'Eliminar', destructive: true });
    if (ok) remove.mutate(c.id);
  }

  const courses = data?.data ?? [];

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar cursos…"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-56"
        />
        <Select
          items={categoryItems}
          value={filters.category || 'ALL'}
          onValueChange={(v) => updateFilters({ category: v === 'ALL' ? '' : v })}
          className="w-44"
        />
        <Select
          items={TYPE_ITEMS}
          value={filters.type || 'ALL'}
          onValueChange={(v) => updateFilters({ type: v === 'ALL' ? '' : v })}
          className="w-44"
        />
        <Select
          items={MODALITY_ITEMS}
          value={filters.modality || 'ALL'}
          onValueChange={(v) => updateFilters({ modality: v === 'ALL' ? '' : v })}
          className="w-44"
        />
        <Select
          items={STATUS_ITEMS}
          value={filters.status || 'ALL'}
          onValueChange={(v) => updateFilters({ status: v === 'ALL' ? '' : v })}
          className="w-40"
        />
        <Select
          items={LEVEL_ITEMS}
          value={filters.level || 'ALL'}
          onValueChange={(v) => updateFilters({ level: v === 'ALL' ? '' : v })}
          className="w-40"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={filters.departmentId || 'ALL'}
          onValueChange={(v) => updateFilters({ departmentId: v === 'ALL' ? '' : v })}
          className="w-48"
        />
        <Input
          type="text"
          placeholder="Unidade…"
          value={filters.unit}
          onChange={(e) => updateFilters({ unit: e.target.value })}
          className="w-36"
        />
        <span className="ml-auto text-sm text-ink-faint">{data?.total ?? 0} cursos</span>
      </div>

      {isLoading && <Skeleton rows={4} />}

      {!isLoading && courses.length === 0 && (
        <EmptyState
          title="Nenhum curso encontrado"
          description="Ajusta os filtros ou cria um novo curso."
        />
      )}

      {!isLoading && courses.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <div className="grid min-w-[1200px] grid-cols-[100px_1.6fr_130px_120px_110px_140px_90px_90px_90px_110px_110px_110px_40px] gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Código</div>
            <div>Nome</div>
            <div>Categoria</div>
            <div>Tipo</div>
            <div>Modalidade</div>
            <div>Instrutor</div>
            <div>Duração</div>
            <div>Nível</div>
            <div>Formandos</div>
            <div>Progresso médio</div>
            <div>Estado</div>
            <div>Publicação</div>
            <div />
          </div>

          {courses.map((c) => {
            const noModules = c._count.modules === 0;
            return (
              <div
                key={c.id}
                className="grid min-w-[1200px] grid-cols-[100px_1.6fr_130px_120px_110px_140px_90px_90px_90px_110px_110px_110px_40px] items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
              >
                <div className="truncate text-xs font-mono text-ink-faint">{c.internalCode ?? '—'}</div>
                <button type="button" className="min-w-0 text-left" onClick={() => onSelect(c.id)}>
                  <div className="truncate text-sm font-medium text-ink">{c.title}</div>
                </button>
                <div className="truncate text-xs text-ink-muted">{c.category ?? '—'}</div>
                <div className="truncate text-xs text-ink-muted">
                  {c.type ? COURSE_TYPE_LABELS[c.type] : '—'}
                </div>
                <div className="truncate text-xs text-ink-muted">
                  {c.modality ? COURSE_MODALITY_LABELS[c.modality] : '—'}
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  {c.primaryInstructor ? (
                    <>
                      <Avatar name={c.primaryInstructor.fullName} url={c.primaryInstructor.avatarUrl ?? undefined} size="sm" />
                      <span className="truncate text-xs text-ink-muted">{c.primaryInstructor.fullName}</span>
                    </>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </div>
                <div className="text-xs text-ink-muted">{fmtDuration(c.workloadHours)}</div>
                <div className="text-xs text-ink-muted">{LEVEL_ITEMS.find((l) => l.value === c.level)?.label ?? '—'}</div>
                <div className="font-mono text-xs text-ink-muted">{c._count.enrollments}</div>
                <div className="font-mono text-xs text-ink-muted">{c.avgProgress ?? 0}%</div>
                <div>
                  <StatusBadge value={c.status} map={COURSE_STATUS_MAP} variant="dot" />
                </div>
                <div className="text-xs text-ink-faint">
                  {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString('pt') : '—'}
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-control p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                        disabled={rowBusy(c.id)}
                      >
                        <MoreHorizontal size={16} strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onSelect(c.id)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditCourseId(c.id)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => duplicate.mutate(c.id)}>Duplicar</DropdownMenuItem>
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
                        <DropdownMenuItem onSelect={() => pause.mutate(c.id)}>Despublicar</DropdownMenuItem>
                      )}
                      {c.status === 'PAUSED' && (
                        <DropdownMenuItem onSelect={() => resume.mutate(c.id)}>Retomar</DropdownMenuItem>
                      )}
                      {c.status === 'ARCHIVED' ? (
                        <DropdownMenuItem onSelect={() => restore.mutate(c.id)}>Repor rascunho</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => onArchive(c)}>Arquivar</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setEnrollFor(c.id)}>
                        Inscrever colaboradores
                      </DropdownMenuItem>
                      {onViewEnrollments && (
                        <DropdownMenuItem onSelect={() => onViewEnrollments(c.id)}>
                          Ver inscrições / progresso
                        </DropdownMenuItem>
                      )}
                      {onManageModules && (
                        <DropdownMenuItem onSelect={() => onManageModules(c.id)}>
                          Gerir módulos
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => setAddModuleFor(c.id)}>
                        <Plus size={14} strokeWidth={1.75} className="mr-1 inline" />
                        Adicionar módulo
                      </DropdownMenuItem>
                      {c.requiresApproval && (
                        <DropdownMenuItem onSelect={() => setPendingFor(c)}>
                          Pedidos de inscrição
                        </DropdownMenuItem>
                      )}
                      {(c.status === 'DRAFT' || c.status === 'ARCHIVED') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-danger-ink" onSelect={() => onDelete(c)}>
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
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
            toast({ title: 'Módulo adicionado. Já podes publicar o curso.', intent: 'success' })
          }
        />
      )}

      {editCourseId !== null && (
        <EditCourseModal
          courseId={editCourseId}
          onClose={() => setEditCourseId(null)}
          onSuccess={() => toast({ title: 'Curso actualizado.', intent: 'success' })}
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
        <EnrollUserModal initialCourseId={enrollFor} onClose={() => setEnrollFor(null)} />
      )}
    </div>
  );
}
