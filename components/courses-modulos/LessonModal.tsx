// components/courses-modulos/LessonModal.tsx
// Modal de criação/edição de lição. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { CONTENT_TYPE } from './constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { Lesson } from './types';

interface LessonModalProps {
  moduleId: number;
  editing: Lesson | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonModal({
  moduleId,
  editing,
  onClose,
  onSaved,
}: LessonModalProps) {
  const notify = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    contentType: editing?.contentType ?? 'VIDEO',
    videoUrl: editing?.videoUrl ?? '',
    pdfUrl: editing?.pdfUrl ?? '',
    seq: editing?.seq ?? 1,
  });
  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const saveLesson = useApiMutation(
    () => {
      const payload = {
        moduleId,
        title: form.title,
        contentType: form.contentType,
        seq: +form.seq,
        videoUrl: form.videoUrl || undefined,
        pdfUrl: form.pdfUrl || undefined,
      };
      return editing
        ? apiClient.put(`/lessons/${editing.id}`, payload)
        : apiClient.post('/lessons', payload);
    },
    {
      onSuccess: () => {
        onSaved();
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const saving = saveLesson.isPending;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveLesson.mutate(undefined);
  }

  return (
    <div
      className="fixed inset-0 z-600 bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-ink">
              {editing ? '✏️ Editar Lição' : '📖 Nova Lição'}
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
            <FormField label="Título *" htmlFor="lesson-title">
              <Input
                id="lesson-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </FormField>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2 block">
                Tipo de Conteúdo *
              </label>
              <div className="flex gap-2">
                {Object.entries(CONTENT_TYPE).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set('contentType', k)}
                    style={
                      form.contentType === k
                        ? {
                            borderColor: v.color,
                            backgroundColor: v.bg,
                          }
                        : undefined
                    }
                    className={cn(
                      'flex-1 py-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all border-2',
                      form.contentType !== k && 'border-border bg-surface',
                    )}
                  >
                    <span className="text-lg">{v.icon}</span>
                    <span
                      className={cn(
                        'text-xs font-bold',
                        form.contentType !== k && 'text-ink-faint',
                      )}
                      style={
                        form.contentType === k ? { color: v.color } : undefined
                      }
                    >
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {(form.contentType === 'VIDEO' ||
              form.contentType === 'AVATAR') && (
              <FormField label="URL do Vídeo" htmlFor="lesson-video">
                <Input
                  id="lesson-video"
                  value={form.videoUrl}
                  onChange={(e) => set('videoUrl', e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
            )}

            {form.contentType === 'PDF' && (
              <FormField label="URL do PDF" htmlFor="lesson-pdf">
                <Input
                  id="lesson-pdf"
                  value={form.pdfUrl}
                  onChange={(e) => set('pdfUrl', e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
            )}

            <FormField label="Sequência" htmlFor="lesson-seq">
              <Input
                id="lesson-seq"
                type="number"
                min={1}
                value={form.seq}
                onChange={(e) => set('seq', +e.target.value)}
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
