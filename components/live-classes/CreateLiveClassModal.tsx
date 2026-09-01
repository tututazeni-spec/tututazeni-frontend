// components/live-classes/CreateLiveClassModal.tsx
// Modal "+ Nova Aula" da página de aulas ao vivo. Segue o padrão de
// components/enrollments/EnrollUserModal — a page só monta o componente
// quando está aberto, por isso o Modal fica sempre `open` e `onOpenChange`
// delega em `onClose` (X, clique fora, Escape).
//
// Submete em POST /live-classes (@Roles(ADMIN, RH) no backend). O botão que
// abre esta modal já está escondido para quem não é ADMIN/RH — aqui só
// blindamos o payload: data local -> ISO, ids -> número.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface CreateLiveClassModalProps {
  onClose: () => void;
}

// GET /courses devolve { data, meta } (pagination.helper). Catálogo enxuto
// para o Combobox — hook local para não acoplar este módulo ao de matrículas
// (components/enrollments/enrollData.ts tem um equivalente).
function useCourseOptions() {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; title: string }[] }>(
    queryKeys.courses.list({ picker: 'live-class', ...params }),
    '/courses',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const options = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
  return { options, loading: query.isLoading };
}

export function CreateLiveClassModal({ onClose }: CreateLiveClassModalProps) {
  const notify = useToast();
  const { options: courseOptions } = useCourseOptions();

  const [courseId, setCourseId] = useState('');
  const [topic, setTopic] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [zoomMeetingId, setZoomMeetingId] = useState('');
  const [submitError, setSubmitError] = useState('');

  const durationNum = Number(duration);
  const canSubmit =
    Boolean(courseId) &&
    topic.trim().length > 0 &&
    scheduledAt.length > 0 &&
    Number.isFinite(durationNum) &&
    durationNum > 0;

  const createClass = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/live-classes', body),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: () => {
        notify({ title: 'Aula ao vivo criada', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao criar a aula. Tente novamente.'),
    },
  );
  const loading = createClass.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    const iso = new Date(scheduledAt);
    if (Number.isNaN(iso.getTime())) {
      setSubmitError('Data e hora inválidas.');
      return;
    }
    setSubmitError('');
    createClass.mutate({
      courseId: Number(courseId),
      topic: topic.trim(),
      scheduledAt: iso.toISOString(),
      duration: Math.trunc(durationNum),
      ...(recordingUrl.trim() ? { recordingUrl: recordingUrl.trim() } : {}),
      ...(zoomMeetingId.trim() ? { zoomMeetingId: zoomMeetingId.trim() } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Aula ao Vivo"
        description="Agenda uma sessão de formação ao vivo associada a um curso."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Curso *" htmlFor="lc-course">
            <Combobox
              items={courseOptions}
              value={courseId}
              onValueChange={setCourseId}
              placeholder="Selecionar curso…"
              searchPlaceholder="Escreva para filtrar…"
            />
          </FormField>

          <FormField label="Tópico *" htmlFor="lc-topic">
            <Input
              id="lc-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: Introdução ao novo CRM"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Data e hora *" htmlFor="lc-scheduled">
              <Input
                id="lc-scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </FormField>

            <FormField label="Duração (min) *" htmlFor="lc-duration">
              <Input
                id="lc-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            label="URL da gravação"
            htmlFor="lc-recording"
            hint="Opcional — pode ser adicionado mais tarde."
          >
            <Input
              id="lc-recording"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder="https://…"
            />
          </FormField>

          <FormField
            label="ID da reunião"
            htmlFor="lc-zoom"
            hint="Opcional — identificador Zoom/externo."
          >
            <Input
              id="lc-zoom"
              value={zoomMeetingId}
              onChange={(e) => setZoomMeetingId(e.target.value)}
              placeholder="Ex.: 123 4567 8900"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar Aula
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
