// components/courses-modulos/LessonModal.tsx
// Modal de criação/edição de lição. Extraído de
// app/(platform)/courses/modulos/page.tsx; campos alinhados com as secções
// "4. Módulo → Lições", "5. Tipo de conteúdo", "6. Configuração da lição" e
// "7. Actividades dentro da lição" / "9. Recursos da lição" de
// docs/06-modulo-courses.md.
//
// Achados reais ao expandir este modal:
// 1. `POST /lessons` e `PUT /lessons/:id` apontavam para rotas que nunca
//    existiram no backend — corrigido para
//    /courses/modules/:moduleId/lessons e /courses/lessons/:lessonId.
// 2. O payload enviava `contentType`, mas o DTO real (CreateLessonDto)
//    espera `type` — o nome do campo nunca bateu certo com o backend.
// 3. O tipo 'AVATAR' do selector de conteúdo não é um valor válido do enum
//    LessonType do Prisma (ver constants.ts) — removido.

'use client';

import { useState } from 'react';
import { Pencil, BookMarked, Plus, Trash2, FileQuestion } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { STALE_TIME } from '@/lib/queryClient';
import { fileToPdfDataUrl, pdfErrorMessage } from '@/lib/lessonPdf';
import { fileToSlideDataUrl, slideErrorMessage } from '@/lib/lessonSlide';
import { CONTENT_TYPE } from './constants';
import { QuizEditorModal } from './QuizEditorModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { Lesson, LessonActivityType } from './types';

interface LessonModalProps {
  moduleId: number;
  editing: Lesson | null;
  /** Outras aulas do módulo — para escolher a aula pré-requisito. */
  otherLessons: Lesson[];
  onClose: () => void;
  onSaved: () => void;
  /** Refresca o curso sem fechar o modal — usado pelas actividades/recursos. */
  onRefresh: () => Promise<unknown>;
}

const RESOURCE_TYPE_ITEMS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'ARTICLE', label: 'Artigo' },
  { value: 'VIDEO', label: 'Vídeo' },
  { value: 'LINK', label: 'Link' },
  { value: 'BOOK', label: 'Livro' },
  { value: 'FILE', label: 'Ficheiro' },
  { value: 'TEMPLATE', label: 'Modelo/Template' },
  { value: 'SUPPORT_MATERIAL', label: 'Material de apoio' },
];

const ACTIVITY_TYPE_ITEMS: { value: LessonActivityType; label: string }[] = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'VIDEO', label: 'Vídeo' },
  { value: 'DOCUMENT', label: 'Documento' },
  { value: 'IMAGE', label: 'Imagem' },
  { value: 'AUDIO', label: 'Áudio' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'OPEN_QUESTION', label: 'Pergunta aberta' },
  { value: 'EXERCISE', label: 'Exercício' },
  { value: 'TASK', label: 'Tarefa' },
  { value: 'SURVEY', label: 'Inquérito' },
  { value: 'DISCUSSION', label: 'Discussão' },
  { value: 'DOWNLOAD', label: 'Ficheiro para download' },
  { value: 'EXTERNAL_LINK', label: 'Link externo' },
];

export function LessonModal({
  moduleId,
  editing,
  otherLessons,
  onClose,
  onSaved,
  onRefresh,
}: LessonModalProps) {
  const notify = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    code: editing?.code ?? '',
    description: editing?.description ?? '',
    learningObjectives: (editing?.learningObjectives ?? []).join('\n'),
    contentType: editing?.type ?? 'VIDEO',
    status: editing?.status ?? 'PUBLISHED',
    contentUrl: editing?.contentUrl ?? '',
    textContent: editing?.textContent ?? '',
    captionsUrl: editing?.captionsUrl ?? '',
    transcript: editing?.transcript ?? '',
    seq: editing?.seq ?? 1,
    durationMinutes: editing?.durationMinutes != null ? String(editing.durationMinutes) : '',
    mandatory: editing?.mandatory ?? true,
    allowSkip: editing?.allowSkip ?? true,
    allowDownload: editing?.allowDownload ?? false,
    autoComplete: editing?.autoComplete ?? false,
    minWatchSeconds: editing?.minWatchSeconds != null ? String(editing.minWatchSeconds) : '',
    requiresActivity: editing?.requiresActivity ?? false,
    requiresAssessment: editing?.requiresAssessment ?? false,
    availableFrom: editing?.availableFrom ? editing.availableFrom.slice(0, 10) : '',
    availableUntil: editing?.availableUntil ? editing.availableUntil.slice(0, 10) : '',
    liveDate: editing?.liveDate ? editing.liveDate.slice(0, 16) : '',
    liveSessionUrl: editing?.liveSessionUrl ?? '',
    liveInstructorId: editing?.liveInstructorId ? String(editing.liveInstructorId) : '',
    requiredLessonId: editing?.requiredLessonId ? String(editing.requiredLessonId) : '',
  });

  const prerequisiteItems = otherLessons
    .filter((l) => l.id !== editing?.id)
    .sort((a, b) => a.seq - b.seq)
    .map((l) => ({ value: String(l.id), label: `${l.seq}. ${l.title}` }));

  const { data: instructorsResp } = useApiQuery<{ data: { id: number; fullName: string }[] }>(
    ['courses-modulos', 'instructors-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const instructorItems = (instructorsResp?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.fullName,
  }));
  function set(k: string, v: string | number | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Estado do selector de ficheiro (contentType === 'PDF' ou 'SLIDE').
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const isFileType = form.contentType === 'PDF' || form.contentType === 'SLIDE';
  const isUrlType = ['VIDEO', 'AUDIO', 'LINK', 'SCORM'].includes(form.contentType);

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
      const payload: Record<string, unknown> = {
        title: form.title,
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        learningObjectives: form.learningObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        type: form.contentType,
        status: form.status,
        seq: +form.seq,
        contentUrl: form.contentType !== 'TEXT' ? form.contentUrl || undefined : undefined,
        textContent: form.contentType === 'TEXT' ? form.textContent || undefined : undefined,
        captionsUrl:
          form.contentType === 'VIDEO' ? form.captionsUrl.trim() || undefined : undefined,
        transcript:
          form.contentType === 'VIDEO' || form.contentType === 'AUDIO'
            ? form.transcript.trim() || undefined
            : undefined,
        durationMinutes: form.durationMinutes !== '' ? +form.durationMinutes : undefined,
        mandatory: form.mandatory,
        allowSkip: form.allowSkip,
        allowDownload: form.allowDownload,
        autoComplete: form.autoComplete,
        minWatchSeconds: form.minWatchSeconds !== '' ? +form.minWatchSeconds : undefined,
        requiresActivity: form.requiresActivity,
        requiresAssessment: form.requiresAssessment,
        availableFrom: form.availableFrom || undefined,
        availableUntil: form.availableUntil || undefined,
        liveDate: form.contentType === 'LIVE' && form.liveDate ? form.liveDate : undefined,
        liveSessionUrl:
          form.contentType === 'LIVE' ? form.liveSessionUrl || undefined : undefined,
        liveInstructorId:
          form.contentType === 'LIVE' && form.liveInstructorId
            ? +form.liveInstructorId
            : undefined,
        requiredLessonId: form.requiredLessonId ? +form.requiredLessonId : null,
      };
      return editing
        ? apiClient.put(`/courses/lessons/${editing.id}`, payload)
        : apiClient.post(`/courses/modules/${moduleId}/lessons`, payload);
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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              {editing ? (
                <>
                  <Pencil size={18} strokeWidth={1.75} /> Editar Lição
                </>
              ) : (
                <>
                  <BookMarked size={18} strokeWidth={1.75} /> Nova Lição
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
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Título *" htmlFor="lesson-title">
                <Input
                  id="lesson-title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Código" htmlFor="lesson-code">
                <Input
                  id="lesson-code"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="Ex: L-01"
                />
              </FormField>
            </div>

            <FormField label="Descrição" htmlFor="lesson-description">
              <Textarea
                id="lesson-description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
              />
            </FormField>

            <FormField label="Objectivos de aprendizagem" htmlFor="lesson-objectives">
              <Textarea
                id="lesson-objectives"
                value={form.learningObjectives}
                onChange={(e) => set('learningObjectives', e.target.value)}
                rows={2}
                placeholder={'Um objectivo por linha'}
              />
            </FormField>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2 block">
                Tipo de Conteúdo *
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONTENT_TYPE).map(([k, v]) => {
                  const VIcon = v.icon;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set('contentType', k)}
                      style={
                        form.contentType === k
                          ? { borderColor: v.color, backgroundColor: v.bg }
                          : undefined
                      }
                      className={cn(
                        'w-[72px] py-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all border-2',
                        form.contentType !== k && 'border-border bg-surface',
                      )}
                    >
                      <span style={{ color: v.color }}>
                        <VIcon size={18} strokeWidth={1.75} />
                      </span>
                      <span
                        className={cn(
                          'text-xs font-bold text-center leading-tight',
                          form.contentType !== k && 'text-ink-faint',
                        )}
                        style={form.contentType === k ? { color: v.color } : undefined}
                      >
                        {v.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.contentType === 'TEXT' && (
              <FormField label="Conteúdo" htmlFor="lesson-text">
                <Textarea
                  id="lesson-text"
                  value={form.textContent}
                  onChange={(e) => set('textContent', e.target.value)}
                  rows={5}
                />
              </FormField>
            )}

            {isUrlType && (
              <FormField
                label={form.contentType === 'VIDEO' ? 'URL do Vídeo' : 'URL do conteúdo'}
                htmlFor="lesson-url"
              >
                <Input
                  id="lesson-url"
                  value={form.contentUrl}
                  onChange={(e) => set('contentUrl', e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
            )}

            {form.contentType === 'VIDEO' && (
              <FormField label="Legendas (URL)" htmlFor="lesson-captions">
                <Input
                  id="lesson-captions"
                  value={form.captionsUrl}
                  onChange={(e) => set('captionsUrl', e.target.value)}
                  placeholder="https://... (.vtt/.srt)"
                />
              </FormField>
            )}

            {(form.contentType === 'VIDEO' || form.contentType === 'AUDIO') && (
              <FormField label="Transcrição" htmlFor="lesson-transcript">
                <Textarea
                  id="lesson-transcript"
                  value={form.transcript}
                  onChange={(e) => set('transcript', e.target.value)}
                  rows={3}
                />
              </FormField>
            )}

            {form.contentType === 'LIVE' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Data/hora" htmlFor="lesson-live-date">
                  <Input
                    id="lesson-live-date"
                    type="datetime-local"
                    value={form.liveDate}
                    onChange={(e) => set('liveDate', e.target.value)}
                  />
                </FormField>
                <FormField label="Link da sessão" htmlFor="lesson-live-url">
                  <Input
                    id="lesson-live-url"
                    value={form.liveSessionUrl}
                    onChange={(e) => set('liveSessionUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </FormField>
                <FormField label="Instrutor" htmlFor="lesson-live-instructor">
                  <Select
                    items={instructorItems}
                    value={form.liveInstructorId || undefined}
                    onValueChange={(v) => set('liveInstructorId', v)}
                    className="w-full"
                    placeholder="Não definido"
                  />
                </FormField>
              </div>
            )}

            {isFileType && (
              <FormField
                label={form.contentType === 'SLIDE' ? 'Ficheiro PPTX' : 'Ficheiro PDF'}
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
                {fileBusy && <p className="text-xs text-ink-faint mt-1">A processar…</p>}
                {fileError && <p className="text-xs text-danger mt-1">{fileError}</p>}
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

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sequência" htmlFor="lesson-seq">
                <Input
                  id="lesson-seq"
                  type="number"
                  min={1}
                  value={form.seq}
                  onChange={(e) => set('seq', +e.target.value)}
                />
              </FormField>
              <FormField label="Duração (min)" htmlFor="lesson-duration">
                <Input
                  id="lesson-duration"
                  type="number"
                  min={0}
                  value={form.durationMinutes}
                  onChange={(e) => set('durationMinutes', e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Estado" htmlFor="lesson-status">
                <Select
                  items={[
                    { value: 'DRAFT', label: 'Rascunho' },
                    { value: 'PUBLISHED', label: 'Publicado' },
                  ]}
                  value={form.status}
                  onValueChange={(v) => set('status', v)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Tempo mínimo de visualização (s)" htmlFor="lesson-min-watch">
                <Input
                  id="lesson-min-watch"
                  type="number"
                  min={0}
                  value={form.minWatchSeconds}
                  onChange={(e) => set('minWatchSeconds', e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Disponível a partir de" htmlFor="lesson-available-from">
                <Input
                  id="lesson-available-from"
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => set('availableFrom', e.target.value)}
                />
              </FormField>
              <FormField label="Data de encerramento" htmlFor="lesson-available-until">
                <Input
                  id="lesson-available-until"
                  type="date"
                  value={form.availableUntil}
                  onChange={(e) => set('availableUntil', e.target.value)}
                />
              </FormField>
            </div>

            {prerequisiteItems.length > 0 && (
              <FormField label="Aula pré-requisito" htmlFor="lesson-required">
                <Select
                  items={prerequisiteItems}
                  value={form.requiredLessonId || undefined}
                  onValueChange={(v) => set('requiredLessonId', v)}
                  className="w-full"
                  placeholder="Nenhuma"
                />
              </FormField>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[
                ['mandatory', 'Obrigatória'],
                ['allowSkip', 'Permitir avançar antes de concluir'],
                ['autoComplete', 'Marcar automaticamente como concluída'],
                ['requiresActivity', 'Exigir actividade'],
                ['requiresAssessment', 'Exigir avaliação'],
                ['allowDownload', 'Permitir download'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof typeof form])}
                    onChange={(e) => set(key, e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
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

          {editing && (
            <LessonActivitiesAndResources lesson={editing} onRefresh={onRefresh} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ── Actividades e recursos (só disponível a editar uma lição já criada) ────

function LessonActivitiesAndResources({
  lesson,
  onRefresh,
}: {
  lesson: Lesson;
  onRefresh: () => Promise<unknown>;
}) {
  const notify = useToast();
  const [activityForm, setActivityForm] = useState({ type: 'TEXT' as LessonActivityType, title: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', fileType: 'PDF' });
  const [quizEditorOpen, setQuizEditorOpen] = useState(false);

  const addActivity = useApiMutation(
    () =>
      apiClient.post(`/courses/lessons/${lesson.id}/activities`, {
        type: activityForm.type,
        title: activityForm.title,
        seq: (lesson.activities?.length ?? 0),
      }),
    {
      onSuccess: async () => {
        setActivityForm({ type: 'TEXT', title: '' });
        await onRefresh();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const removeActivity = useApiMutation(
    (activityId: number) => apiClient.delete(`/courses/lessons/activities/${activityId}`),
    {
      onSuccess: () => onRefresh(),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const addResource = useApiMutation(
    () =>
      apiClient.post(`/courses/lessons/${lesson.id}/resources`, {
        title: resourceForm.title,
        url: resourceForm.url,
        fileType: resourceForm.fileType,
      }),
    {
      onSuccess: async () => {
        setResourceForm({ title: '', url: '', fileType: 'PDF' });
        await onRefresh();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const removeResource = useApiMutation(
    (resourceId: number) => apiClient.delete(`/courses/lessons/resources/${resourceId}`),
    {
      onSuccess: () => onRefresh(),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-4">
      {/* Actividades */}
      <div>
        <h3 className="m-0 mb-2 text-sm font-bold text-ink">Actividades</h3>
        <div className="flex flex-col gap-1.5 mb-2">
          {(lesson.activities ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-lg bg-surface-sunken border border-border px-3 py-1.5"
            >
              <span className="text-xs font-bold text-ink-faint">
                {ACTIVITY_TYPE_ITEMS.find((t) => t.value === a.type)?.label ?? a.type}
              </span>
              <span className="flex-1 text-sm text-ink truncate">{a.title}</span>
              <button
                type="button"
                onClick={() => removeActivity.mutate(a.id)}
                className="text-ink-faint hover:text-danger"
                aria-label="Remover actividade"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
          {(lesson.activities ?? []).length === 0 && (
            <p className="m-0 text-xs text-ink-faint">Nenhuma actividade adicionada.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Select
            items={ACTIVITY_TYPE_ITEMS}
            value={activityForm.type}
            onValueChange={(v) => setActivityForm((f) => ({ ...f, type: v as LessonActivityType }))}
            className="w-40"
          />
          <Input
            value={activityForm.title}
            onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título da actividade"
            className="flex-1"
          />
          <Button
            type="button"
            intent="secondary"
            disabled={!activityForm.title.trim() || addActivity.isPending}
            onClick={() => addActivity.mutate(undefined)}
          >
            <Plus size={14} strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* Recursos */}
      <div>
        <h3 className="m-0 mb-2 text-sm font-bold text-ink">Recursos / Material de apoio</h3>
        <div className="flex flex-col gap-1.5 mb-2">
          {(lesson.resources ?? []).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-lg bg-surface-sunken border border-border px-3 py-1.5"
            >
              {r.fileType && (
                <span className="text-xs font-bold text-ink-faint">
                  {RESOURCE_TYPE_ITEMS.find((t) => t.value === r.fileType)?.label ?? r.fileType}
                </span>
              )}
              <span className="flex-1 text-sm text-ink truncate">{r.title}</span>
              <button
                type="button"
                onClick={() => removeResource.mutate(r.id)}
                className="text-ink-faint hover:text-danger"
                aria-label="Remover recurso"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
          {(lesson.resources ?? []).length === 0 && (
            <p className="m-0 text-xs text-ink-faint">Nenhum recurso adicionado.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Select
            items={RESOURCE_TYPE_ITEMS}
            value={resourceForm.fileType}
            onValueChange={(v) => setResourceForm((f) => ({ ...f, fileType: v }))}
            className="w-40"
          />
          <Input
            value={resourceForm.title}
            onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título"
            className="flex-1"
          />
          <Input
            value={resourceForm.url}
            onChange={(e) => setResourceForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="URL"
            className="flex-1"
          />
          <Button
            type="button"
            intent="secondary"
            disabled={!resourceForm.title.trim() || !resourceForm.url.trim() || addResource.isPending}
            onClick={() => addResource.mutate(undefined)}
          >
            <Plus size={14} strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* Avaliação (quiz) — docs/06-modulo-courses.md secção 8 */}
      <div>
        <h3 className="m-0 mb-2 text-sm font-bold text-ink">Avaliação (Quiz)</h3>
        <Button type="button" intent="secondary" onClick={() => setQuizEditorOpen(true)}>
          <FileQuestion size={14} strokeWidth={1.75} /> Configurar quiz
        </Button>
      </div>
      {quizEditorOpen && (
        <QuizEditorModal
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          onClose={() => setQuizEditorOpen(false)}
        />
      )}
    </div>
  );
}
