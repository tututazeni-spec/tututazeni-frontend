// components/live-classes/RecordingsView.tsx
// Separador "Gravações" (docs/aulas-ao-vivo.md secção 9) — promovido de
// sub-tab de "Aulas" (ver LiveClassesView.tsx) a separador de topo próprio,
// agora numa tabela (Aula/Sessão/Formador/Data/Duração/Participantes/
// Link/Estado/Disponibilização/Expiração) em vez da grelha de cartões
// anterior, cobrindo tanto gravações ao nível da Aula como da Sessão
// (aulas recorrentes) — ver live-classes.service.ts#listRecordings.

'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { RecordingModal } from './RecordingModal';
import type { PaginatedMeta, RecordingRow } from './types';

function routeFor(r: RecordingRow) {
  return r.sessionId
    ? `/live-classes/${r.liveClassId}/sessions/${r.sessionId}/recording`
    : `/live-classes/${r.liveClassId}/recording`;
}

export function RecordingsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<RecordingRow | null>(null);
  const [editing, setEditing] = useState<RecordingRow | null>(null);
  const [editForm, setEditForm] = useState({ recordingUrl: '', recordingExpiresAt: '' });

  const params = { page, limit: 20 };
  const { data, isLoading } = useApiQuery<PaginatedMeta<RecordingRow>>(
    queryKeys.liveClasses.recordings(params),
    '/live-classes/recordings',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const invalidateKeys = [queryKeys.liveClasses.all];

  const togglePublish = useApiMutation(
    (r: RecordingRow) => apiClient.post(`${routeFor(r)}/${r.publishedAt ? 'unpublish' : 'publish'}`, {}),
    {
      invalidateKeys,
      onSuccess: (_d, r) => toast({ title: r.publishedAt ? 'Gravação despublicada.' : 'Gravação publicada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation((r: RecordingRow) => apiClient.delete(routeFor(r)), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Gravação eliminada.', intent: 'success' }),
    onError: (e) => toast({ title: e.message, intent: 'danger' }),
  });

  async function onRemove(r: RecordingRow) {
    const ok = await confirm({ title: `Eliminar a gravação de "${r.topic}"?`, confirmLabel: 'Eliminar', destructive: true });
    if (ok) remove.mutate(r);
  }

  function openEdit(r: RecordingRow) {
    setEditForm({
      recordingUrl: r.recordingUrl,
      recordingExpiresAt: r.expiresAt ? r.expiresAt.slice(0, 10) : '',
    });
    setEditing(r);
  }

  const save = useApiMutation(
    (r: RecordingRow) => {
      const payload = r.sessionId
        ? { recordingUrl: editForm.recordingUrl }
        : {
            recordingUrl: editForm.recordingUrl,
            recordingExpiresAt: editForm.recordingExpiresAt
              ? new Date(editForm.recordingExpiresAt).toISOString()
              : undefined,
          };
      return r.sessionId
        ? apiClient.put(`/live-classes/${r.liveClassId}/sessions/${r.sessionId}`, payload)
        : apiClient.put(`/live-classes/${r.liveClassId}`, payload);
    },
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Gravação actualizada.', intent: 'success' });
        setEditing(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading) return <Skeleton rows={4} />;

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sem gravações disponíveis"
        description="As gravações aparecem aqui após as aulas/sessões terminarem e o URL ser guardado."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="divide-y divide-border">
        {rows.map((r) => (
          <div key={`${r.liveClassId}-${r.sessionId ?? 0}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">
                {r.topic}
                {r.sessionSeq ? ` · Sessão ${r.sessionSeq}` : ''}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                <span>{r.course?.title ?? '—'}</span>
                <span>· {r.instructor?.name ?? 'Sem formador'}</span>
                <span>· {formatDateTime(r.date)}</span>
                <span>· {r.durationMinutes}min</span>
                <span>· {r.participants} participante(s)</span>
                {r.expiresAt && <span>· Expira {formatDateTime(r.expiresAt)}</span>}
              </div>
            </div>
            <span
              className={`rounded px-2 py-0.5 font-body text-xs font-medium ${
                r.publishedAt ? 'bg-success-subtle text-success-ink' : 'bg-surface-sunken text-ink-faint'
              }`}
            >
              {r.publishedAt ? `Publicada ${formatDateTime(r.publishedAt)}` : 'Não publicada'}
            </span>
            <div className="flex gap-2">
              <Button intent="ghost" size="sm" onClick={() => setViewing(r)}>
                Ver
              </Button>
              <a
                href={r.recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-control px-2 py-1 font-body text-xs text-ink-muted hover:bg-surface-sunken"
              >
                <ExternalLink size={13} strokeWidth={1.75} />
              </a>
              {canManage && (
                <>
                  <Button intent="ghost" size="sm" onClick={() => openEdit(r)}>
                    Editar
                  </Button>
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => togglePublish.mutate(r)}
                    loading={togglePublish.isPending && togglePublish.variables === r}
                  >
                    {r.publishedAt ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                    {r.publishedAt ? 'Despublicar' : 'Publicar'}
                  </Button>
                  <Button
                    intent="danger"
                    size="sm"
                    onClick={() => onRemove(r)}
                    loading={remove.isPending && remove.variables === r}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button intent="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </Button>
          <span className="py-2 px-3 text-sm text-ink-muted">
            {page} / {totalPages}
          </span>
          <Button intent="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Seguinte →
          </Button>
        </div>
      )}

      {viewing && (
        <RecordingModal
          lc={{
            topic: viewing.sessionSeq ? `${viewing.topic} · Sessão ${viewing.sessionSeq}` : viewing.topic,
            recordingUrl: viewing.recordingUrl,
            duration: viewing.durationMinutes,
            scheduledAt: viewing.date,
            course: viewing.course,
            _count: { attendances: viewing.participants },
          }}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <Modal open onOpenChange={(open) => !open && setEditing(null)}>
          <ModalContent title={`Editar gravação — ${editing.topic}`}>
            <div className="mt-4 space-y-4">
              <FormField label="URL da gravação" htmlFor="rv-url">
                <Input
                  id="rv-url"
                  value={editForm.recordingUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, recordingUrl: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              {!editing.sessionId && (
                <FormField label="Data de expiração" htmlFor="rv-expires">
                  <Input
                    id="rv-expires"
                    type="date"
                    value={editForm.recordingExpiresAt}
                    onChange={(e) => setEditForm((f) => ({ ...f, recordingExpiresAt: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              )}
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 justify-center" onClick={() => save.mutate(editing)} loading={save.isPending}>
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
