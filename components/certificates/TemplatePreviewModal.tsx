// components/certificates/TemplatePreviewModal.tsx
// Pré-visualização do certificado em PDF, gerada pelo servidor com dados de exemplo.
// Mostra a configuração GUARDADA (templateId) ou um rascunho ainda por guardar (config);
// nada é gravado.

'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TemplateConfigDto, TemplateDetailDto } from './types';

export interface TemplatePreviewModalProps {
  templateId?: string;
  config?: TemplateConfigDto;
  onClose: () => void;
}

export function TemplatePreviewModal({
  templateId,
  config,
  onClose,
}: TemplatePreviewModalProps) {
  const detail = useApiQuery<TemplateDetailDto>(
    queryKeys.certificates.template(templateId ?? ''),
    `/certificates/templates/${templateId}`,
    { enabled: !config && !!templateId },
  );
  const effective = config ?? detail.data?.config;
  const key = effective ? JSON.stringify(effective) : null;

  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setError(null);
    fetch(`${API_URL}/certificates/templates/preview`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: key,
    })
      .then(async (res) => {
        if (!res.ok) {
          let message = 'Não foi possível gerar a pré-visualização.';
          try {
            const body = (await res.json()) as { message?: string | string[] };
            if (body.message)
              message = Array.isArray(body.message)
                ? body.message.join(' ')
                : body.message;
          } catch {
            /* corpo não-JSON */
          }
          throw new Error(message);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error
              ? e.message
              : 'Erro ao gerar a pré-visualização.',
          );
      });
    return () => {
      cancelled = true;
      // Revogar já deixaria o separador/visualizador sem o ficheiro.
      if (objectUrl) {
        const u = objectUrl;
        setTimeout(() => URL.revokeObjectURL(u), 60_000);
      }
    };
  }, [key]);

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Pré-visualização do certificado"
        description="Gerada com dados de exemplo; nada é gravado."
        className="max-w-4xl"
        navyHeader
      >
        <div className="space-y-3">
          {error ? (
            <AlertCard
              variant="danger"
              title="Não foi possível pré-visualizar"
              message={error}
              compact
            />
          ) : url ? (
            <iframe
              title="Pré-visualização do certificado"
              src={url}
              className="h-[60vh] w-full rounded border border-border"
            />
          ) : (
            <div role="status" aria-live="polite">
              <Skeleton
                rows={1}
                itemClassName="h-[50vh] w-full rounded bg-surface-sunken"
              />
              <p className="mt-2 text-sm text-ink-muted">
                A gerar a pré-visualização…
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {url && (
              <Button
                intent="secondary"
                onClick={() => window.open(url, '_blank', 'noopener')}
              >
                <ExternalLink size={14} strokeWidth={1.75} />
                Abrir noutro separador
              </Button>
            )}
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
