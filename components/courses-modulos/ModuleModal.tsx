// components/courses-modulos/ModuleModal.tsx
// Modal de criação/edição de módulo. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { Pencil, Package } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/providers/ToastProvider';
import type { CourseModule } from './types';

interface ModuleModalProps {
  courseId: number;
  editing: CourseModule | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ModuleModal({
  courseId,
  editing,
  onClose,
  onSaved,
}: ModuleModalProps) {
  const notify = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    seq: editing?.seq ?? 1,
  });

  const saveModule = useApiMutation(
    () =>
      editing
        ? apiClient.put(`/modules/${editing.id}`, {
            title: form.title,
            seq: +form.seq,
          })
        : apiClient.post('/modules', {
            courseId,
            title: form.title,
            seq: +form.seq,
          }),
    {
      // Invalida também a árvore 'courses' (['courses', ...]) para que a
      // contagem _count.modules na aba Gestão de cursos e no catálogo
      // reflicta o módulo acabado de criar — sem isto o botão "Publicar"
      // ficava preso em desativado até o staleTime expirar.
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        onSaved();
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const saving = saveModule.isPending;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveModule.mutate(undefined);
  }
  return (
    <div
      className="fixed inset-0 z-500 bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              {editing ? (
                <>
                  <Pencil size={18} strokeWidth={1.75} /> Editar Módulo
                </>
              ) : (
                <>
                  <Package size={18} strokeWidth={1.75} /> Novo Módulo
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-2xl text-ink-faint hover:text-ink transition-colors"
            >
              ×
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <FormField label="Título *" htmlFor="module-title">
              <Input
                id="module-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
              />
            </FormField>

            <FormField label="Sequência" htmlFor="module-seq">
              <Input
                id="module-seq"
                type="number"
                min={1}
                value={form.seq}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seq: +e.target.value }))
                }
              />
            </FormField>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={onClose} intent="ghost">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                intent="primary"
                loading={saving}
              >
                {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
