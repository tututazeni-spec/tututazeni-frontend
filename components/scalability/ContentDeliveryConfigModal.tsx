// components/scalability/ContentDeliveryConfigModal.tsx
// Modal "Configurar CDN" — separador Conteúdo & CDN do módulo de
// Escalabilidade. Mapeado 1:1 para UpdateContentDeliveryConfigDto
// (src/scalability/scalability.dto.ts) — PATCH /scalability/content-delivery/:tenantId.
//
// O endpoint faz upsert (ver ScalabilityService.updateContentDeliveryConfig)
// — este modal serve tanto para criar a configuração pela primeira vez como
// para a editar depois, por isso recebe a config actual (ou null) e pré-
// preenche o formulário quando já existe.

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
import type { ContentDeliveryConfig } from './types';

export interface ContentDeliveryConfigModalProps {
  tenantId: string;
  config: ContentDeliveryConfig | null;
  onClose: () => void;
}

interface ContentDeliveryPayload {
  cdnProvider?: string;
  cdnBaseUrl?: string;
  adaptiveBitrate?: boolean;
  offlineSyncEnabled?: boolean;
  maxOfflineDays?: number;
  compressionEnabled?: boolean;
  maxVideoSizeMb?: number;
  allowedFormats?: string[];
}

function optionalPositiveInt(raw: string): number | undefined | null {
  if (raw.trim() === '') return undefined;
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= 1 ? n : null;
}

export function ContentDeliveryConfigModal({
  tenantId,
  config,
  onClose,
}: ContentDeliveryConfigModalProps) {
  const notify = useToast();

  const [cdnProvider, setCdnProvider] = useState(config?.cdnProvider ?? '');
  const [cdnBaseUrl, setCdnBaseUrl] = useState(config?.cdnBaseUrl ?? '');
  const [adaptiveBitrate, setAdaptiveBitrate] = useState(config?.adaptiveBitrate ?? true);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(config?.offlineSyncEnabled ?? false);
  const [maxOfflineDays, setMaxOfflineDays] = useState(String(config?.maxOfflineDays ?? '7'));
  const [compressionEnabled, setCompressionEnabled] = useState(config?.compressionEnabled ?? true);
  const [maxVideoSizeMb, setMaxVideoSizeMb] = useState(String(config?.maxVideoSizeMb ?? '500'));
  const [allowedFormats, setAllowedFormats] = useState(
    (config?.allowedFormats ?? ['mp4', 'pdf']).join(', '),
  );

  const saveMutation = useApiMutation<unknown, ContentDeliveryPayload>(
    (payload) => apiClient.patch(`/scalability/content-delivery/${tenantId}`, payload),
    {
      invalidateKeys: [
        queryKeys.scalability.contentDelivery(),
        queryKeys.scalability.dashboard(),
      ],
    },
  );

  const offlineDays = optionalPositiveInt(maxOfflineDays);
  const videoSize = optionalPositiveInt(maxVideoSizeMb);

  const canSubmit =
    cdnProvider.trim().length > 0 &&
    offlineDays !== null &&
    videoSize !== null &&
    videoSize !== undefined &&
    !saveMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    saveMutation.mutate(
      {
        cdnProvider: cdnProvider.trim(),
        cdnBaseUrl: cdnBaseUrl.trim() || undefined,
        adaptiveBitrate,
        offlineSyncEnabled,
        maxOfflineDays: offlineDays ?? undefined,
        compressionEnabled,
        maxVideoSizeMb: videoSize,
        allowedFormats: allowedFormats
          .split(',')
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          notify({ title: 'Configuração de entrega de conteúdo guardada', intent: 'success' });
          onClose();
        },
        onError: (err) => {
          reportError(err, { source: 'ContentDeliveryConfigModal.handleSubmit' });
          notify({ title: 'Não foi possível guardar a configuração de CDN', intent: 'danger' });
        },
      },
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Configurar entrega de conteúdo"
        description="Define o CDN, bitrate adaptativo e regras de sincronização offline usados na distribuição de vídeos, SCORM e PDFs."
        className="max-h-[85vh] max-w-lg overflow-y-auto"
      >
        <div className="mt-5 flex flex-col gap-4">
          <FormField label="Fornecedor de CDN *" htmlFor="cdn-provider">
            <Input
              id="cdn-provider"
              value={cdnProvider}
              onChange={(e) => setCdnProvider(e.target.value)}
              placeholder="Ex.: Cloudflare, CloudFront, Akamai"
            />
          </FormField>

          <FormField label="URL base do CDN" htmlFor="cdn-baseurl" hint="Opcional">
            <Input
              id="cdn-baseurl"
              value={cdnBaseUrl}
              onChange={(e) => setCdnBaseUrl(e.target.value)}
              placeholder="https://cdn.exemplo.com"
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={adaptiveBitrate}
              onChange={(e) => setAdaptiveBitrate(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Bitrate adaptativo (ajusta a qualidade do vídeo à ligação do utilizador)
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={compressionEnabled}
              onChange={(e) => setCompressionEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Compressão de conteúdo activada
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={offlineSyncEnabled}
              onChange={(e) => setOfflineSyncEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Sincronização offline activada
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Dias de cache offline"
              htmlFor="cdn-offlinedays"
              hint={offlineSyncEnabled ? '≥ 1' : 'Só aplicável com sincronização offline activada'}
              error={offlineDays === null && maxOfflineDays.trim() !== '' ? 'Número inteiro ≥ 1.' : undefined}
            >
              <Input
                id="cdn-offlinedays"
                inputMode="numeric"
                value={maxOfflineDays}
                onChange={(e) => setMaxOfflineDays(e.target.value)}
                disabled={!offlineSyncEnabled}
                placeholder="7"
              />
            </FormField>

            <FormField
              label="Tamanho máx. de vídeo (MB) *"
              htmlFor="cdn-maxvideosize"
              hint="≥ 1"
              error={videoSize === null && maxVideoSizeMb.trim() !== '' ? 'Número inteiro ≥ 1.' : undefined}
            >
              <Input
                id="cdn-maxvideosize"
                inputMode="numeric"
                value={maxVideoSizeMb}
                onChange={(e) => setMaxVideoSizeMb(e.target.value)}
                placeholder="500"
              />
            </FormField>
          </div>

          <FormField
            label="Formatos suportados"
            htmlFor="cdn-formats"
            hint="Separados por vírgula (ex.: mp4, pdf, scorm)"
          >
            <Input
              id="cdn-formats"
              value={allowedFormats}
              onChange={(e) => setAllowedFormats(e.target.value)}
              placeholder="mp4, pdf, scorm"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saveMutation.isPending ? 'A guardar…' : 'Guardar configuração'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
