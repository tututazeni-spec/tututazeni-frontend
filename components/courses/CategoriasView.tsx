// components/courses/CategoriasView.tsx
// Aba "Categorias" (docs/modulo_courses.md secção 6, ADMIN/RH). Categoria é
// um registo de gestão (nome/descrição/estado) distinto do campo livre
// Course.category — a contagem "Cursos associados" é feita por
// correspondência de nome no backend (GET /courses/categories/manage).

'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Textarea } from '@/components/ui/Textarea';
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
    (vars: { name: string; description?: string }) =>
      apiClient.patch(`/courses/categories/${category!.id}`, vars),
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
    const vars = { name: form.name.trim(), description: form.description.trim() || undefined };
    if (category) update.mutate(vars);
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
            <p className="rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">{error}</p>
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
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full"
            />
          </FormField>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
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

export function CategoriasView() {
  const confirm = useConfirm();
  const toast = useToast();
  const [modalFor, setModalFor] = useState<CourseCategoryManaged | 'new' | null>(null);

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
      apiClient.patch(`/courses/categories/${vars.id}`, { isActive: vars.isActive }),
    { invalidateKeys, onError: (e) => toast({ title: e.message, intent: 'danger' }) },
  );

  const remove = useApiMutation((id: number) => apiClient.delete(`/courses/categories/${id}`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Categoria removida', intent: 'success' }),
    onError: (e) => toast({ title: e.message, intent: 'danger' }),
  });

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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Categoria</TableHeaderCell>
              <TableHeaderCell>Descrição</TableHeaderCell>
              <TableHeaderCell>Cursos associados</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium text-ink">{cat.name}</TableCell>
                <TableCell className="text-ink-muted">{cat.description || '—'}</TableCell>
                <TableCell className="text-ink-muted">{cat.courseCount}</TableCell>
                <TableCell>
                  <button
                    onClick={() =>
                      toggleActive.mutate({ id: cat.id, isActive: !cat.isActive })
                    }
                  >
                    <StatusBadge
                      value={cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      map={{
                        ACTIVE: { label: 'Activa', cls: 'bg-success-subtle text-success-ink' },
                        INACTIVE: { label: 'Inactiva', cls: 'bg-surface-sunken text-ink-faint' },
                      }}
                    />
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" intent="ghost" onClick={() => setModalFor(cat)}>
                      <Pencil size={14} strokeWidth={1.75} />
                    </Button>
                    <Button size="sm" intent="ghost" onClick={() => onDelete(cat)}>
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
