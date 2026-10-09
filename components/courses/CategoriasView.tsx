// components/courses/CategoriasView.tsx
// Aba "Categorias" (docs/modulo_courses.md secção 6, ADMIN/RH). Categoria é
// um registo de gestão (nome/descrição/estado) distinto do campo livre
// Course.category — a contagem "Cursos associados" é feita por
// correspondência de nome no backend (GET /courses/categories/manage).

'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  BookPlus,
  CircleCheck,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/Textarea';
import { NAVY_ACTION, NavyBadge, NavyCard } from './NavyCard';
import { Skeleton } from './shared';
import type { CourseCategoryManaged } from './types';

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

function CategoryCourseListModal({
  category,
  onClose,
  onSelect,
}: {
  category: CourseCategoryManaged;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const { data = [], isLoading } = useApiQuery<CategoryCourseRow[]>(
    [...queryKeys.courses.categoriesManaged(), category.id, 'courses'],
    `/courses/categories/${category.id}/courses`,
    { staleTime: 0 },
  );
  const courses = data.filter((c) => c.inCategory);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={`Cursos em "${category.name}"`} className="max-w-lg">
        <div className="mt-4 max-h-96 space-y-1 overflow-y-auto">
          {isLoading ? (
            <Skeleton rows={4} />
          ) : courses.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              Nenhum curso nesta categoria.
            </p>
          ) : (
            courses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-sunken"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {c.title}
                </span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {c.status}
                </span>
              </button>
            ))
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

export function CategoriasView({
  onSelectCourse,
}: {
  onSelectCourse?: (id: number) => void;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [modalFor, setModalFor] = useState<
    CourseCategoryManaged | 'new' | null
  >(null);
  const [coursesFor, setCoursesFor] = useState<CourseCategoryManaged | null>(
    null,
  );
  const [listFor, setListFor] = useState<CourseCategoryManaged | null>(null);

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
      message:
        'Os cursos desta categoria não são apagados, ficam apenas sem categoria.',
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
          <div className="space-y-5">
            {data.map((cat) => (
              <NavyCard
                key={cat.id}
                title={cat.name}
                subtitle={cat.description || undefined}
                badge={
                  <NavyBadge
                    onClick={() =>
                      toggleActive.mutate({
                        id: cat.id,
                        isActive: !cat.isActive,
                      })
                    }
                  >
                    {cat.isActive ? 'Activa' : 'Inactiva'}
                  </NavyBadge>
                }
                actions={
                  <>
                    <button
                      type="button"
                      className={NAVY_ACTION}
                      title="Gerir cursos"
                      aria-label="Gerir cursos"
                      onClick={() => setCoursesFor(cat)}
                    >
                      <BookPlus size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={NAVY_ACTION}
                      title="Editar categoria"
                      aria-label="Editar categoria"
                      onClick={() => setModalFor(cat)}
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={NAVY_ACTION}
                      title="Eliminar categoria"
                      aria-label="Eliminar categoria"
                      onClick={() => onDelete(cat)}
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </>
                }
                infos={[
                  {
                    icon: BookOpen,
                    value: `${cat.courseCount} ${cat.courseCount === 1 ? 'curso' : 'cursos'}`,
                    label: 'Ver cursos da categoria',
                    disabled: cat.courseCount === 0,
                    onClick: () => setListFor(cat),
                  },
                  {
                    icon: CircleCheck,
                    value: cat.isActive ? 'Activa' : 'Inactiva',
                    label: 'Estado',
                  },
                ]}
              />
            ))}
          </div>
        </div>
      )}

      {listFor && (
        <CategoryCourseListModal
          category={listFor}
          onClose={() => setListFor(null)}
          onSelect={(id) => {
            setListFor(null);
            onSelectCourse?.(id);
          }}
        />
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
