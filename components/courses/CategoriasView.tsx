// components/courses/CategoriasView.tsx
// Aba "Categorias" (docs/modulo_courses.md secção 6, ADMIN/RH). Categoria é
// um registo de gestão (nome/descrição/estado) distinto do campo livre
// Course.category — a contagem "Cursos associados" é feita por
// correspondência de nome no backend (GET /courses/categories/manage).

'use client';

import { useMemo, useState } from 'react';
import { BookPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from './shared';
import type { CourseCategoryManaged } from './types';

const PANEL = 'rounded-xl border border-border/60 bg-surface-sunken/40 p-3';

interface CategoryFormState {
  name: string;
  description: string;
}

function CategoryModal({
  category,
  onClose,
}: {
  category: CourseCategoryManaged | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<CategoryFormState>({
    name: category?.name ?? '',
    description: category?.description ?? '',
  });
  const [error, setError] = useState('');

  const invalidateKeys = [
    queryKeys.courses.categoriesManaged(),
    queryKeys.courses.categories(),
  ];

  const create = useApiMutation(
    (vars: { name: string; description?: string }) =>
      apiClient.post('/courses/categories', vars),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Categoria criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao criar categoria.'),
    },
  );

  const update = useApiMutation(
    ({ id, ...body }: { id: number; name: string; description?: string }) =>
      apiClient.patch(`/courses/categories/${id}`, body),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Categoria actualizada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao actualizar categoria.'),
    },
  );

  const saving = create.isPending || update.isPending;

  function handleSubmit() {
    if (!form.name.trim()) {
      setError('Indica um nome para a categoria.');
      return;
    }
    setError('');
    const vars = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    };
    if (category) update.mutate({ id: category.id, ...vars });
    else create.mutate(vars);
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={category ? 'Editar categoria' : 'Nova categoria'}
        className="max-w-md"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <p className="rounded-card bg-danger-subtle p-3 text-sm text-black">
              {error}
            </p>
          )}
          <FormField label="Nome *" htmlFor="cat-name">
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full"
            />
          </FormField>
          <FormField label="Descrição" htmlFor="cat-desc">
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full"
            />
          </FormField>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={saving}
            disabled={saving}
          >
            {category ? 'Guardar' : 'Criar categoria'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

interface CategoryCourseRow {
  id: number;
  title: string;
  status: string;
  category: string | null;
  inCategory: boolean;
}

function CategoryCoursesModal({
  category,
  onClose,
}: {
  category: CourseCategoryManaged;
  onClose: () => void;
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number> | null>(null);

  const { data = [], isLoading } = useApiQuery<CategoryCourseRow[]>(
    [...queryKeys.courses.categoriesManaged(), category.id, 'courses'],
    `/courses/categories/${category.id}/courses`,
    { staleTime: 0 },
  );

  const checked = useMemo(
    () => selected ?? new Set(data.filter((c) => c.inCategory).map((c) => c.id)),
    [selected, data],
  );

  const save = useApiMutation(
    (courseIds: number[]) =>
      apiClient.put(`/courses/categories/${category.id}/courses`, {
        courseIds,
      }),
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        toast({ title: 'Cursos da categoria actualizados', intent: 'success' });
        onClose();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  function toggle(id: number) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const term = search.trim().toLowerCase();
  const visible = term
    ? data.filter((c) => c.title.toLowerCase().includes(term))
    : data;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={`Cursos em "${category.name}"`} className="max-w-lg">
        <div className="mt-4 space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar curso…"
            className="w-full"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {isLoading ? (
              <Skeleton rows={4} />
            ) : visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                Nenhum curso encontrado.
              </p>
            ) : (
              visible.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-sunken"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {c.title}
                  </span>
                  {c.category && c.category !== category.name && (
                    <span className="shrink-0 text-xs text-ink-faint">
                      {c.category}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
          <p className="text-xs text-ink-muted">
            {checked.size} seleccionado(s). Cursos de outra categoria passam
            para esta ao guardar.
          </p>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => save.mutate([...checked])}
            loading={save.isPending}
            disabled={save.isPending || isLoading}
          >
            Guardar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function CategoriasView() {
  const confirm = useConfirm();
  const toast = useToast();
  const [modalFor, setModalFor] = useState<
    CourseCategoryManaged | 'new' | null
  >(null);
  const [coursesFor, setCoursesFor] = useState<CourseCategoryManaged | null>(
    null,
  );

  const { data = [], isLoading } = useApiQuery<CourseCategoryManaged[]>(
    queryKeys.courses.categoriesManaged(),
    '/courses/categories/manage',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [
    queryKeys.courses.categoriesManaged(),
    queryKeys.courses.categories(),
  ];

  const toggleActive = useApiMutation(
    (vars: { id: number; isActive: boolean }) =>
      apiClient.patch(`/courses/categories/${vars.id}`, {
        isActive: vars.isActive,
      }),
    {
      invalidateKeys,
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/courses/categories/${id}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Categoria removida', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(cat: CourseCategoryManaged) {
    const ok = await confirm({
      title: `Eliminar "${cat.name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(cat.id);
  }

  if (isLoading) return <Skeleton rows={4} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setModalFor('new')}>
          <Plus size={14} strokeWidth={1.75} />
          Nova categoria
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Ainda não há categorias"
          description="Cria a primeira categoria para organizar o catálogo de cursos."
        />
      ) : (
        <div>
          <div className="space-y-3">
            {data.map((cat) => (
              <div
                key={cat.id}
                className={`flex flex-col gap-3 rounded-2xl border border-l-4 border-border bg-surface/60 p-4 shadow-sm backdrop-blur-md hover:bg-surface ${cat.isActive ? 'border-l-emerald-500' : 'border-l-slate-400'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="line-clamp-2 text-sm font-semibold uppercase text-ink">
                      {cat.name}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      intent="ghost"
                      title="Gerir cursos"
                      onClick={() => setCoursesFor(cat)}
                    >
                      <BookPlus size={14} strokeWidth={1.75} />
                    </Button>
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => setModalFor(cat)}
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </Button>
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => onDelete(cat)}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr]">
                  <div
                    className={`${PANEL} col-span-2 flex min-w-0 items-center lg:col-span-1`}
                  >
                    <span className="line-clamp-3 text-xs text-ink-muted">
                      {cat.description || '—'}
                    </span>
                  </div>
                  <div
                    className={`${PANEL} flex flex-col items-center justify-center gap-1`}
                  >
                    <span className="font-mono text-lg font-semibold text-ink">
                      {cat.courseCount}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {cat.courseCount === 1 ? 'curso' : 'cursos'}
                    </span>
                  </div>
                  <div className={`${PANEL} flex items-center`}>
                    <button
                      onClick={() =>
                        toggleActive.mutate({
                          id: cat.id,
                          isActive: !cat.isActive,
                        })
                      }
                    >
                      <StatusBadge
                        value={cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                        variant="dot"
                        map={{
                          ACTIVE: {
                            label: 'Activa',
                            cls: 'bg-success-subtle text-success-ink',
                          },
                          INACTIVE: {
                            label: 'Inactiva',
                            cls: 'bg-surface-sunken text-ink-faint',
                          },
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coursesFor && (
        <CategoryCoursesModal
          category={coursesFor}
          onClose={() => setCoursesFor(null)}
        />
      )}

      {modalFor && (
        <CategoryModal
          category={modalFor === 'new' ? null : modalFor}
          onClose={() => setModalFor(null)}
        />
      )}
    </div>
  );
}
