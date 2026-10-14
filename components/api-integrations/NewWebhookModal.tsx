// components/api-integrations/NewWebhookModal.tsx
// Modal "Novo Webhook" — POST /api-integrations/webhooks (CreateWebhookDto).

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface NewWebhookModalProps {
  onClose: () => void;
}

interface CreateWebhookPayload {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  retryMax?: number;
}

// Espelha WebhookEventType em src/api-integration/api-integration.dto.ts
const EVENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'employee.created', label: 'Colaborador criado' },
  { value: 'employee.updated', label: 'Colaborador actualizado' },
  { value: 'employee.deactivated', label: 'Colaborador desactivado' },
  { value: 'course.completed', label: 'Curso concluído' },
  { value: 'course.enrolled', label: 'Inscrição em curso' },
  { value: 'pdi.approved', label: 'PDI aprovado' },
  { value: 'pdi.completed', label: 'PDI concluído' },
  { value: 'evaluation.completed', label: 'Avaliação concluída' },
  { value: 'report.generated', label: 'Relatório gerado' },
  { value: 'badge.awarded', label: 'Badge atribuído' },
  { value: 'document.signed', label: 'Documento assinado' },
];

export function NewWebhookModal({ onClose }: NewWebhookModalProps) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [retryMax, setRetryMax] = useState('3');
  const [events, setEvents] = useState<string[]>([]);

  const createMutation = useApiMutation<unknown, CreateWebhookPayload>(
    (payload) => apiClient.post('/api-integrations/webhooks', payload),
    { invalidateKeys: [queryKeys.apiIntegrations.webhooks()] },
  );

  const urlValid = /^https?:\/\/\S+$/i.test(url.trim());
  const canSubmit =
    name.trim().length > 0 &&
    urlValid &&
    events.length > 0 &&
    !createMutation.isPending;

  const toggleEvent = (value: string) =>
    setEvents((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        url: url.trim(),
        events,
        secret: secret.trim() || undefined,
        retryMax: Number.isFinite(Number(retryMax))
          ? Math.max(0, Math.floor(Number(retryMax)))
          : undefined,
      });
      notify({ title: 'Webhook criado', intent: 'success' });
      onClose();
    } catch (e) {
      reportError(e, { source: 'NewWebhookModal.create' });
      notify({ title: 'Não foi possível criar o webhook', intent: 'danger' });
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Webhook"
        description="Recebe eventos da plataforma em tempo real num endpoint externo."
        className="max-h-[85vh] max-w-xl overflow-y-auto"
      >
        <div className="mt-5 flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nw-name">
            <Input
              id="nw-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Notificar ERP"
              maxLength={100}
            />
          </FormField>
          <FormField label="URL de destino" htmlFor="nw-url">
            <Input
              id="nw-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/webhook"
            />
          </FormField>
          <div>
            <p className="mb-2 font-body text-sm font-medium text-ink">
              Eventos subscritos
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EVENT_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(o.value)}
                    onChange={() => toggleEvent(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Segredo (opcional)" htmlFor="nw-secret">
              <Input
                id="nw-secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Gerado automaticamente se vazio"
              />
            </FormField>
            <FormField label="Máx. tentativas" htmlFor="nw-retry">
              <Input
                id="nw-retry"
                type="number"
                min={0}
                value={retryMax}
                onChange={(e) => setRetryMax(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createMutation.isPending ? 'A criar…' : 'Criar Webhook'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
