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
  BookOpen,
  CalendarDays,
  MapPin,
  Monitor,
  MoreHorizontal,
  Plus,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (parts[0][0] + last).toUpperCase();
}

interface CourseInfoProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

function CourseInfo({ icon: Icon, value, label }: CourseInfoProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 sm:px-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0D6EFD]">
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold leading-tight text-[#0F1F3D]">
          {value}
        </div>
        <div className="text-[11px] leading-tight text-[#71829B]">{label}</div>
      </div>
    </div>
  );
}

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
      onSuccess: () => toast({ title: 'Curso eliminado.', intent: 'success' }),
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
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(c.id);
  }

  const courses = data?.data ?? [];

  return (
    <div>
      {/* Filtros — grid de largura uniforme (8 campos: 2 pesquisas + 6
          selects, em 1/2/3 colunas; departamentos ocupa 2 no ecrã largo para o texto caber sem ser cortado) em vez de larguras w-* ad-hoc por campo, para que todos
          os controlos fiquem com o mesmo tamanho e alinhados em colunas. */}
      {/* Painel de filtros: cartão com #0F1F3D a 8% de opacidade */}
      <div className="mb-5 rounded-2xl border border-[#0F1F3D]/20 bg-[#0F1F3D]/8 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            type="text"
            placeholder="Pesquisar cursos…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full"
          />
          <Input
            type="text"
            placeholder="Unidade…"
            value={filters.unit}
            onChange={(e) => updateFilters({ unit: e.target.value })}
            className="w-full"
          />
          <Select
            items={categoryItems}
            value={filters.category || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ category: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            items={TYPE_ITEMS}
            value={filters.type || 'ALL'}
            onValueChange={(v) => updateFilters({ type: v === 'ALL' ? '' : v })}
            className="w-full"
          />
          <Select
            items={MODALITY_ITEMS}
            value={filters.modality || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ modality: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            items={STATUS_ITEMS}
            value={filters.status || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ status: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            items={LEVEL_ITEMS}
            value={filters.level || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ level: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={filters.departmentId || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ departmentId: v === 'ALL' ? '' : v })
            }
            className="w-full lg:col-span-2"
          />
        </div>
        <div className="flex justify-end">
          <span className="text-sm text-black">{data?.total ?? 0} cursos</span>
        </div>
      </div>

      {isLoading && <Skeleton rows={4} />}

      {!isLoading && courses.length === 0 && (
        <EmptyState
          title="Nenhum curso encontrado"
          description="Ajusta os filtros ou cria um novo curso."
        />
      )}

      {!isLoading && courses.length > 0 && (
        <div>
          <div className="space-y-3">
            {courses.map((c) => {
              const noModules = c._count.modules === 0;
              const levelLabel = LEVEL_ITEMS.find(
                (l) => l.value === c.level,
              )?.label;
              return (
                <div
                  key={c.id}
                  className="overflow-hidden rounded-2xl border border-[#DCE5F1] bg-white shadow-[0_8px_24px_rgba(15,31,61,0.08)]"
                >
                  <div className="bg-gradient-to-br from-[#0F1F3D] to-[#132B52] px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 basis-48">
                        <span className="mb-0.5 inline-block rounded-full bg-white/10 px-2 font-mono text-[10px] font-semibold text-[#C7D4E8]">
                          {c.internalCode ?? '—'}
                        </span>
                        <button
                          type="button"
                          className="block w-full min-w-0 text-left"
                          onClick={() => onSelect(c.id)}
                        >
                          <h3 className="line-clamp-1 text-base font-semibold uppercase leading-tight text-white">
                            {c.title}
                          </h3>
                        </button>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#263F67] px-2.5 py-1 text-[11px] text-white">
                          <span aria-hidden>●</span>
                          {COURSE_STATUS_MAP[c.status]?.label ?? c.status}
                        </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-[#C7D4E8] hover:bg-white/10 hover:text-white disabled:opacity-50"
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
                          {(c.status === 'DRAFT' ||
                            c.status === 'ARCHIVED') && (
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
                      </div>
                    </div>
                    <div className="mt-2 flex min-w-0 items-center gap-3">
                      {c.primaryInstructor?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.primaryInstructor.avatarUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D6EFD] text-xs font-bold text-white">
                          {c.primaryInstructor
                            ? initials(c.primaryInstructor.fullName)
                            : '?'}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold leading-tight text-white">
                          {c.primaryInstructor?.fullName ?? 'Sem instrutor'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#C7D4E8]">
                          <Tag size={12} strokeWidth={1.75} className="shrink-0" />
                          <span className="truncate">
                            {[c.category, levelLabel].filter(Boolean).join(' · ') ||
                              '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 px-3 py-3 lg:grid-cols-4 lg:gap-y-0">
                    <CourseInfo
                      icon={BookOpen}
                      value={c.type ? COURSE_TYPE_LABELS[c.type] : '—'}
                      label="Tipo"
                    />
                    <div className="lg:border-l lg:border-[#DCE5F1]">
                      <CourseInfo
                        icon={c.modality === 'ONLINE' ? Monitor : MapPin}
                        value={`${c.modality ? COURSE_MODALITY_LABELS[c.modality] : '—'} · ${fmtDuration(c.workloadHours)}`}
                        label="Modalidade"
                      />
                    </div>
                    <div className="lg:border-l lg:border-[#DCE5F1]">
                      <CourseInfo
                        icon={CalendarDays}
                        value={
                          c.publishedAt
                            ? new Date(c.publishedAt).toLocaleDateString('pt')
                            : '—'
                        }
                        label="Publicação"
                      />
                    </div>
                    <div className="lg:border-l lg:border-[#DCE5F1]">
                      <CourseInfo
                        icon={Users}
                        value={`Formandos: ${c._count.enrollments}`}
                        label={`Progresso médio: ${Math.round(c.avgProgress ?? 0)}%`}
                      />
                    </div>
                  </div>
                </div>
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
