// components/courses-modulos/LessonModal.tsx
// Modal de criação/edição de lição. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { fileToPdfDataUrl, pdfErrorMessage } from '@/lib/lessonPdf';
import { fileToSlideDataUrl, slideErrorMessage } from '@/lib/lessonSlide';
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
    contentType: editing?.type ?? 'VIDEO',
    contentUrl: editing?.contentUrl ?? '',
    seq: editing?.seq ?? 1,
  });
  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Estado do selector de ficheiro (contentType === 'PDF' ou 'SLIDE').
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const isFileType = form.contentType === 'PDF' || form.contentType === 'SLIDE';

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setFileBusy(true);
    try {
      const dataUrl =
        form.contentType === 'SLIDE'
          ? await fileToSlideDataUrl(file)
          : await fileToPdfDataUrl(file);
      set('contentUrl', dataUrl);
      setFileName(file.name);
    } catch (err) {
      setFileError(
        form.contentType === 'SLIDE'
          ? slideErrorMessage(err)
          : pdfErrorMessage(err),
      );
      set('contentUrl', '');
      setFileName(null);
    } finally {
      setFileBusy(false);
    }
  }

  const saveLesson = useApiMutation(
    () => {
      const payload = {
        moduleId,
        title: form.title,
        contentType: form.contentType,
        seq: +form.seq,
        contentUrl: form.contentUrl || undefined,
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
  const fileMissing = isFileType && !form.contentUrl;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (fileBusy || fileMissing) return;
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
                  value={form.contentUrl}
                  onChange={(e) => set('contentUrl', e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
            )}

            {isFileType && (
              <FormField
                label={
                  form.contentType === 'SLIDE'
                    ? 'Ficheiro PPTX'
                    : 'Ficheiro PDF'
                }
                htmlFor="lesson-file"
              >
                <input
                  id="lesson-file"
                  type="file"
                  accept={
                    form.contentType === 'SLIDE'
                      ? '.ppt,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint'
                      : 'application/pdf'
                  }
                  onChange={handleFilePick}
                  className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-subtle file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                />
                {fileBusy && (
                  <p className="text-xs text-ink-faint mt-1">A processar…</p>
                )}
                {fileError && (
                  <p className="text-xs text-danger mt-1">{fileError}</p>
                )}
                {!fileBusy && !fileError && form.contentUrl && (
                  <p className="text-xs text-success mt-1 break-all">
                    {fileName ??
                      (form.contentUrl.startsWith('data:')
                        ? 'Ficheiro já carregado — escolhe outro para substituir'
                        : form.contentUrl)}
                  </p>
                )}
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
                disabled={saving || fileBusy || fileMissing}
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
