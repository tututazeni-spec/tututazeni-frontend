// components/live-classes/SessionsView.tsx
// Separador "Sessões" (docs/aulas-ao-vivo.md secção 5) — tabela global de
// sessões de todas as aulas recorrentes. Sessões só existem para aulas com
// recurrence != ONCE (ver live-classes.service.ts#buildSessionDates); a
// sala ao vivo/chat continuam ao nível da Aula (ClassCard/[id]/page.tsx),
// aqui só se agenda/regista (data/formador/sala/link/estado).

'use client';

import { useState } from 'react';
import {
  BookOpen,
  Clock,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  User,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { NavyBadge, type NavyTone } from '@/components/courses/NavyCard';
import { PhotoCard } from '@/components/courses/PhotoCard';
import { CourseImageField } from '@/components/courses/CourseImageField';
import { Combobox } from '@/components/ui/Combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { STATUS_CFG } from './constants';
import { useInstructorOptions } from './wizard/wizardData';
import { SessionAttendanceModal } from './SessionAttendanceModal';
import type {
  LiveClassSession,
  LiveClassStatus,
  MeetingProvider,
  PaginatedSessions,
} from './types';

const STATUS_TONE: Record<string, NavyTone> = {
  AGENDADA: 'info',
  EM_PREPARACAO: 'warning',
  EM_CURSO: 'danger',
  CONCLUIDA: 'success',
  CANCELADA: 'neutral',
  ADIADA: 'warning',
};

interface SessionFormState {
  liveClassId: string;
  sessionDate: string;
  durationMinutes: string;
  location: string;
  meetingProvider: MeetingProvider | '';
  meetingUrl: string;
  notes: string;
  thumbnailUrl: string;
}

const EMPTY: SessionFormState = {
  liveClassId: '',
  sessionDate: '',
  durationMinutes: '60',
  location: '',
  meetingProvider: '',
  meetingUrl: '',
  notes: '',
  thumbnailUrl: '',
};

const SESSION_PROVIDER_ITEMS = [
  { value: 'NONE', label: 'Outro link / sala da aula' },
  { value: 'JITSI', label: 'Jitsi (sala da plataforma)' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'TEAMS', label: 'Microsoft Teams' },
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...(Object.keys(STATUS_CFG) as LiveClassStatus[]).map((s) => ({
    value: s,
    label: STATUS_CFG[s].label,
  })),
];

function useLiveClassOptions() {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; topic: string }[] }>(
    queryKeys.liveClasses.list({ picker: 'sessions', ...params }),
    '/live-classes',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const options = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.topic,
  }));
  return { options, loading: query.isLoading };
}

export function SessionsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { options: liveClassOptions } = useLiveClassOptions();

  const [status, setStatus] = useState(''); // '' = Selecionar; 'ALL' = Todos os estados
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<LiveClassSession | 'new' | null>(null);
  const [form, setForm] = useState<SessionFormState>(EMPTY);
  const [instructorFor, setInstructorFor] = useState<LiveClassSession | null>(
    null,
  );
  const [instructorId, setInstructorId] = useState('');
  const [attendanceFor, setAttendanceFor] = useState<LiveClassSession | null>(
    null,
  );
  const { options: instructorOptions, loading: instructorsLoading } =
    useInstructorOptions();

  const params: Record<string, string | number | boolean | null | undefined> = {
    page,
    limit: 20,
  };
  if (status && status !== 'ALL') params.status = status;

  const { data, isLoading } = useApiQuery<PaginatedSessions>(
    queryKeys.liveClasses.allSessions(params),
    '/live-classes/sessions',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  const sessions = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };
  const openEdit = (s: LiveClassSession) => {
    setForm({
      liveClassId: String(s.liveClassId),
      sessionDate: s.sessionDate.slice(0, 16),
      durationMinutes: String(s.durationMinutes),
      location: s.location ?? '',
      meetingProvider: s.meetingProvider ?? '',
      meetingUrl: s.meetingUrl ?? '',
      notes: s.notes ?? '',
      thumbnailUrl: s.thumbnailUrl ?? '',
    });
    setEditing(s);
  };

  const invalidateKeys = [queryKeys.liveClasses.all];

  const save = useApiMutation(
    () => {
      const payload = {
        sessionDate: new Date(form.sessionDate).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        location: form.location || undefined,
        meetingProvider: form.meetingProvider || undefined,
        meetingUrl: form.meetingUrl || undefined,
        notes: form.notes || undefined,
        // '' limpa a imagem ao editar; ao criar é ignorado
        thumbnailUrl: form.thumbnailUrl,
      };
      return editing !== 'new' && editing
        ? apiClient.put(
            `/live-classes/${editing.liveClassId}/sessions/${editing.id}`,
            payload,
          )
        : apiClient.post(`/live-classes/${form.liveClassId}/sessions`, payload);
    },
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Sessão guardada.', intent: 'success' });
        setEditing(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const saveInstructor = useApiMutation(
    (s: LiveClassSession) =>
      apiClient.put(`/live-classes/${s.liveClassId}/sessions/${s.id}`, {
        instructorId: Number(instructorId),
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Formador guardado.', intent: 'success' });
        setInstructorFor(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const publish = useApiMutation(
    (s: LiveClassSession) =>
      apiClient.post(
        `/live-classes/${s.liveClassId}/sessions/${s.id}/publish`,
        {},
      ),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Sessão publicada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (s: LiveClassSession) =>
      apiClient.delete(`/live-classes/${s.liveClassId}/sessions/${s.id}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Sessão eliminada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(s: LiveClassSession) {
    const ok = await confirm({
      title: `Eliminar sessão de ${formatDateTime(s.sessionDate)}?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          variant="underline"
          icon={MapPin}
          items={STATUS_ITEMS}
          value={status}
          placeholder="Selecionar"
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="w-48"
        />
        {canManage && (
          <Button size="sm" onClick={openNew}>
            <Plus size={14} strokeWidth={1.75} />
            Nova sessão
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Sem sessões"
          description="As sessões aparecem aqui para aulas recorrentes (semanais/diárias/personalizadas)."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((s) => (
              <PhotoCard
                key={s.id}
                seed={s.id}
                kicker={`Sessão ${s.seq}`}
                kickerIcon={Video}
                title={s.liveClass?.topic ?? `Aula #${s.liveClassId}`}
                caption={s.liveClass?.course?.title}
                image={s.thumbnailUrl}
                fallback={<Video size={56} strokeWidth={1.25} />}
                badges={
                  <NavyBadge tone={STATUS_TONE[s.status] ?? 'neutral'}>
                    {s.status === 'EM_PREPARACAO'
                      ? 'Rascunho'
                      : (STATUS_CFG[s.status]?.label ?? s.status)}
                  </NavyBadge>
                }
                metrics={[
                  {
                    icon: Clock,
                    text: `${formatDateTime(s.sessionDate)} (${s.durationMinutes}min)`,
                  },
                  {
                    icon: Users,
                    text: `${s._count?.attendances ?? 0} presenças`,
                  },
                ]}
                rows={[
                  { icon: User, text: s.instructor?.name ?? 'Sem formador' },
                  { icon: MapPin, text: s.location || '—' },
                  { icon: BookOpen, text: s.liveClass?.course?.title ?? '—' },
                ]}
                actions={
                  canManage && (
                    <>
                      {s.status === 'EM_PREPARACAO' && (
                        <Button
                          type="button"
                          intent="onDarkGhost"
                          size="sm"
                          onClick={() => publish.mutate(s)}
                        >
                          Publicar
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            intent="onDarkGhost"
                            size="icon"
                            aria-label="Mais ações"
                            title="Mais ações"
                          >
                            <MoreVertical size={15} strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(s)}>
                            <Pencil
                              size={13}
                              strokeWidth={1.75}
                              className="mr-2 inline"
                            />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setInstructorId(
                                s.instructor?.id ? String(s.instructor.id) : '',
                              );
                              setInstructorFor(s);
                            }}
                          >
                            <UserPlus
                              size={13}
                              strokeWidth={1.75}
                              className="mr-2 inline"
                            />
                            Adicionar formadores
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setAttendanceFor(s);
                            }}
                          >
                            <Users
                              size={13}
                              strokeWidth={1.75}
                              className="mr-2 inline"
                            />
                            Adicionar presenças
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => onDelete(s)}>
                            <Trash2
                              size={13}
                              strokeWidth={1.75}
                              className="mr-2 inline"
                            />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                intent="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <span className="py-2 px-3 text-sm text-ink-muted">
                {page} / {totalPages}
              </span>
              <Button
                intent="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte →
              </Button>
            </div>
          )}
        </>
      )}

      {editing && (
        <Modal open onOpenChange={(open) => !open && setEditing(null)}>
          <ModalContent
            title={editing === 'new' ? 'Nova sessão' : 'Editar sessão'}
          >
            <div className="mt-4 space-y-4">
              {editing === 'new' && (
                <FormField label="Aula *" htmlFor="sv-liveclass">
                  <Combobox
                    items={liveClassOptions}
                    value={form.liveClassId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, liveClassId: v }))
                    }
                    placeholder="Selecionar aula"
                    searchPlaceholder="Escreva para filtrar…"
                  />
                </FormField>
              )}
              <FormField label="Data e hora *" htmlFor="sv-date">
                <Input
                  id="sv-date"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sessionDate: e.target.value }))
                  }
                  className="w-full"
                />
              </FormField>
              <FormField label="Duração (min) *" htmlFor="sv-duration">
                <Input
                  id="sv-duration"
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                  }
                  className="w-full"
                />
              </FormField>
              <FormField label="Local/sala" htmlFor="sv-location">
                <Input
                  id="sv-location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className="w-full"
                />
              </FormField>
              <FormField label="Plataforma" htmlFor="sv-provider">
                <Select
                  items={SESSION_PROVIDER_ITEMS}
                  value={form.meetingProvider || 'NONE'}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      meetingProvider:
                        v === 'NONE' ? '' : (v as MeetingProvider),
                    }))
                  }
                  className="w-full"
                />
              </FormField>
              {form.meetingProvider !== 'JITSI' && (
                <FormField
                  label={
                    form.meetingProvider === 'ZOOM'
                      ? 'Link ou ID da reunião Zoom'
                      : form.meetingProvider === 'TEAMS'
                        ? 'Link da reunião Teams'
                        : 'Link da reunião'
                  }
                  htmlFor="sv-meetingUrl"
                >
                  <Input
                    id="sv-meetingUrl"
                    value={form.meetingUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, meetingUrl: e.target.value }))
                    }
                    className="w-full"
                  />
                </FormField>
              )}
              <FormField label="Imagem da sessão" htmlFor="sv-thumbnail">
                <CourseImageField
                  value={form.thumbnailUrl || null}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, thumbnailUrl: v ?? '' }))
                  }
                  alt="Pré-visualização da imagem da sessão"
                />
              </FormField>
              <FormField label="Notas" htmlFor="sv-notes">
                <Textarea
                  id="sv-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button
                intent="secondary"
                className="flex-1 justify-center"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => save.mutate(undefined)}
                loading={save.isPending}
                disabled={
                  !form.sessionDate || (editing === 'new' && !form.liveClassId)
                }
              >
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {instructorFor && (
        <Modal open onOpenChange={(open) => !open && setInstructorFor(null)}>
          <ModalContent
            title={`Adicionar formador — sessão ${instructorFor.seq}`}
            className="max-w-md"
          >
            <div className="mt-4 space-y-4">
              <FormField label="Formador *" htmlFor="sv-instructor">
                <Combobox
                  items={instructorOptions}
                  value={instructorId}
                  onValueChange={setInstructorId}
                  placeholder={
                    instructorsLoading ? 'A carregar…' : 'Selecionar formador'
                  }
                  searchPlaceholder="Escreva para filtrar…"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button
                intent="secondary"
                className="flex-1 justify-center"
                onClick={() => setInstructorFor(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => saveInstructor.mutate(instructorFor)}
                loading={saveInstructor.isPending}
                disabled={!instructorId}
              >
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {attendanceFor && (
        <SessionAttendanceModal
          session={attendanceFor}
          onClose={() => setAttendanceFor(null)}
        />
      )}
    </div>
  );
}
