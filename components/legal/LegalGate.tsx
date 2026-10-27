'use client';
// Gate de aceitação: quando o backend indica que a aceitação é obrigatória e há documentos por
// aceitar, mostra um diálogo bloqueante com ligações para os textos. Desligado por omissão
// (LEGAL_ACCEPTANCE_REQUIRED no backend) até a revisão jurídica estar concluída.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from 'radix-ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { friendlyMessage } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';

type DocType = 'TERMS' | 'PRIVACY';

interface LegalStatus {
  required: boolean;
  documents: Array<{
    type: DocType;
    version: string;
    draft: boolean;
    accepted: boolean;
  }>;
  pending: DocType[];
}

const LABEL: Record<DocType, { name: string; href: string }> = {
  TERMS: { name: 'Termos de utilização', href: '/termos' },
  PRIVACY: { name: 'Política de privacidade', href: '/privacidade' },
};

const KEY = ['legal', 'status'] as const;

export function LegalGate() {
  const qc = useQueryClient();
  const { data } = useApiQuery<LegalStatus>([...KEY], '/legal/status', {
    retry: false,
    meta: { silent: true },
  });
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!data?.required || data.pending.length === 0) return null;
  const toAccept = data.documents.filter((d) => data.pending.includes(d.type));

  async function accept() {
    setSending(true);
    setError(undefined);
    try {
      await apiClient.post('/legal/accept', {
        documents: toAccept.map((d) => ({ type: d.type, version: d.version })),
      });
      await qc.invalidateQueries({ queryKey: [...KEY] });
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/60" />
        <Dialog.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-[210] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-panel bg-surface p-6 shadow-lg"
        >
          <Dialog.Title className="font-display text-lg font-bold text-ink">
            Antes de continuar
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-ink-muted">
            Atualizámos os documentos abaixo. Leia-os e aceite para continuar a
            usar a plataforma.
          </Dialog.Description>
          <ul className="mt-4 flex flex-col gap-1 text-sm">
            {toAccept.map((d) => (
              <li key={d.type}>
                <a
                  href={LABEL[d.type].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {LABEL[d.type].name} (versão {d.version})
                </a>
              </li>
            ))}
          </ul>
          <label className="mt-4 flex min-h-[44px] items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            Li e aceito os documentos acima.
          </label>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={!checked}
            loading={sending}
            onClick={accept}
          >
            Aceitar e continuar
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
