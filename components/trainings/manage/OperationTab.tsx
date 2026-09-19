// components/trainings/manage/OperationTab.tsx
// Operação: recursos necessários, documentos administrativos e
// comunicação/notificações aos participantes.

'use client';

import { useState } from 'react';
import { FileText, Send, Trash2, Unlock, Upload } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RESOURCE_KIND_LABEL } from '../constants';
import { fmtDate } from '../utils';
import type { ResourceBooking, Training, TrainingResourceItem } from '../types';

interface OperationTabProps {
  training: Training;
}

export function OperationTab({ training }: OperationTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const invalidateKeys = [queryKeys.trainings.detail(training.id)];

  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docCategory, setDocCategory] = useState('');
  const [message, setMessage] = useState('');
  const [resourceId, setResourceId] = useState('');

  const { data: resourcesResp } = useApiQuery<{ data: TrainingResourceItem[] }>(
    ['training-resources', 'picker'],
    '/training-resources',
    { params: { limit: 200, status: 'AVAILABLE' }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const resourceItems = (resourcesResp?.data ?? []).map((r) => ({
    value: String(r.id),
    label: `${r.name} (${RESOURCE_KIND_LABEL[r.kind]})`,
  }));

  const { data: bookings = [], refetch: refetchBookings } = useApiQuery<ResourceBooking[]>(
    ['training-resources', 'bookings', training.id],
    `/training-resources/bookings/training/${training.id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const reserveResource = useApiMutation(
    () =>
      apiClient.post('/training-resources/bookings', {
        resourceId: Number(resourceId),
        trainingId: training.id,
        startAt: training.startDate ?? new Date().toISOString(),
        endAt: training.endDate ?? training.startDate ?? new Date().toISOString(),
      }),
    {
      onSuccess: () => {
        toast({ title: 'Recurso reservado.', intent: 'success' });
        setResourceId('');
        refetchBookings();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const releaseResource = useApiMutation(
    (bookingId: number) => apiClient.post(`/training-resources/bookings/${bookingId}/release`, {}),
    {
      onSuccess: () => {
        toast({ title: 'Recurso libertado.', intent: 'success' });
        refetchBookings();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const addDocument = useApiMutation(
    () =>
      apiClient.post(`/trainings/${training.id}/documents`, {
        name: docName.trim(),
        fileUrl: docUrl.trim(),
        category: docCategory.trim() || undefined,
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Documento adicionado.', intent: 'success' });
        setDocName('');
        setDocUrl('');
        setDocCategory('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const removeDocument = useApiMutation(
    (id: number) => apiClient.delete(`/trainings/documents/${id}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Documento eliminado.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const notify = useApiMutation(
    () => apiClient.post(`/trainings/${training.id}/notify`, { message: message.trim() }),
    {
      onSuccess: (res: unknown) => {
        const sent = (res as { sent?: number })?.sent ?? 0;
        toast({ title: `Comunicação enviada a ${sent} participante(s).`, intent: 'success' });
        setMessage('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemoveDocument(id: number, name: string) {
    const ok = await confirm({
      title: `Eliminar "${name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removeDocument.mutate(id);
  }

  return (
    <div className="space-y-6">
      {/* Recursos necessários */}
      <Card className="p-4">
        <div className="mb-2 font-body text-sm font-semibold text-ink">Recursos necessários</div>
        {training.requiredResources.length === 0 ? (
          <p className="text-xs text-ink-faint">
            Nenhum recurso indicado — edita a formação para adicionar.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {training.requiredResources.map((r) => (
              <span
                key={r}
                className="rounded bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Salas e recursos reservados (docs/trainings-detalhado.md pt.8) */}
      <Card className="p-4">
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          Salas e recursos reservados
        </div>
        {bookings.length === 0 ? (
          <p className="mb-3 text-xs text-ink-faint">Nenhuma sala/recurso reservado para esta turma.</p>
        ) : (
          <div className="mb-4 space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-control bg-surface-sunken px-3 py-2"
              >
                <span className="text-sm text-ink-muted">
                  {b.resource?.name} ({b.resource ? RESOURCE_KIND_LABEL[b.resource.kind] : ''})
                  <span className="ml-2 text-xs text-ink-faint">
                    {fmtDate(b.startAt)} – {fmtDate(b.endAt)}
                  </span>
                </span>
                <Button
                  intent="ghost"
                  size="sm"
                  onClick={() => releaseResource.mutate(b.id)}
                  loading={releaseResource.isPending && releaseResource.variables === b.id}
                >
                  <Unlock size={14} strokeWidth={1.75} />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-3 border-t border-border pt-3">
          <div className="flex-1">
            <FormField label="Reservar sala/recurso" htmlFor="op-resource">
              <Combobox
                items={resourceItems}
                value={resourceId || undefined}
                onValueChange={setResourceId}
                placeholder="Selecionar"
                className="w-full"
              />
            </FormField>
          </div>
          <Button
            size="sm"
            disabled={!resourceId}
            loading={reserveResource.isPending}
            onClick={() => reserveResource.mutate(undefined)}
          >
            Reservar
          </Button>
        </div>
      </Card>

      {/* Documentos administrativos */}
      <Card className="p-4">
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          Documentos administrativos
        </div>
        {(training.documents ?? []).length === 0 ? (
          <EmptyState title="Sem documentos" description="Adiciona o primeiro documento abaixo." />
        ) : (
          <div className="mb-4 space-y-2">
            {(training.documents ?? []).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-control bg-surface-sunken px-3 py-2"
              >
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText size={14} strokeWidth={1.75} className="flex-shrink-0" />
                  <span className="truncate">{d.name}</span>
                </a>
                <Button
                  intent="ghost"
                  size="sm"
                  onClick={() => onRemoveDocument(d.id, d.name)}
                  loading={removeDocument.isPending && removeDocument.variables === d.id}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-3">
          <FormField label="Nome" htmlFor="op-doc-name">
            <Input
              id="op-doc-name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full"
              placeholder="Ex: Contrato do formador"
            />
          </FormField>
          <FormField label="URL do ficheiro" htmlFor="op-doc-url">
            <Input
              id="op-doc-url"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="w-full"
              placeholder="https://…"
            />
          </FormField>
          <FormField label="Categoria" htmlFor="op-doc-category">
            <Input
              id="op-doc-category"
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>
        <Button
          size="sm"
          className="mt-3"
          disabled={!docName.trim() || !docUrl.trim()}
          loading={addDocument.isPending}
          onClick={() => addDocument.mutate(undefined)}
        >
          <Upload size={14} strokeWidth={1.75} />
          Adicionar documento
        </Button>
      </Card>

      {/* Comunicação / notificações */}
      <Card className="p-4">
        <div className="mb-2 font-body text-sm font-semibold text-ink">
          Comunicação / notificações
        </div>
        <p className="mb-2 text-xs text-ink-faint">
          Envia uma mensagem a todos os participantes com inscrição activa.
        </p>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mb-3 w-full resize-none"
          placeholder="Ex: A sessão de amanhã foi antecipada para as 09h00."
        />
        <Button
          size="sm"
          disabled={!message.trim()}
          loading={notify.isPending}
          onClick={() => notify.mutate(undefined)}
        >
          <Send size={14} strokeWidth={1.75} />
          Enviar comunicação
        </Button>
      </Card>
    </div>
  );
}
