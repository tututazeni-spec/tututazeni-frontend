// components/content-library/RecycleBinPanel.tsx
// Reciclagem (só ADMIN): conteúdos e documentos corporativos apagados ficam 30
// dias e podem ser restaurados; depois são apagados de vez (cron no backend).

'use client';

import { useState } from 'react';
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { formatDateNumeric } from '@/lib/format';

export const RECYCLE_BIN_KEY = ['recycle-bin'] as const;

interface RecycleEntry {
  kind: 'CONTENT' | 'DOCUMENT';
  id: number;
  title: string;
  deletedAt: string;
  daysLeft: number;
}

const KIND_LABEL: Record<RecycleEntry['kind'], string> = {
  CONTENT: 'Conteúdo',
  DOCUMENT: 'Documento corporativo',
};

export function RecycleBinPanel() {
  const [open, setOpen] = useState(false);
  const notify = useToast();
  const { data, isLoading } = useApiQuery<RecycleEntry[]>(
    RECYCLE_BIN_KEY,
    '/recycle-bin',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const items = data ?? [];

  const restore = useApiMutation(
    (e: RecycleEntry) =>
      apiClient.post(
        `/recycle-bin/${e.kind.toLowerCase()}/${e.id}/restore`,
        {},
      ),
    {
      invalidateKeys: [
        [...RECYCLE_BIN_KEY],
        [...queryKeys.contentLibrary.all],
        ['documents'],
      ],
      onSuccess: () => notify({ title: 'Item restaurado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível restaurar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <Card>
      <CardBody className="space-y-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 font-body text-sm font-semibold text-ink"
        >
          <Trash2 size={16} strokeWidth={1.75} className="text-ink-muted" />
          Reciclagem
          <span className="font-normal text-ink-faint">
            ({items.length}) · os itens ficam 30 dias antes de serem apagados
          </span>
          <ChevronDown
            size={15}
            strokeWidth={1.75}
            className={cn('ml-auto transition-transform', open && 'rotate-180')}
          />
        </button>

        {open &&
          (isLoading ? (
            <p className="font-body text-sm text-ink-faint">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">
              A reciclagem está vazia.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((e) => (
                <li
                  key={`${e.kind}-${e.id}`}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm text-ink">
                      {e.title}
                    </p>
                    <p className="font-body text-xs text-ink-faint">
                      {KIND_LABEL[e.kind]} · apagado em{' '}
                      {formatDateNumeric(e.deletedAt)} ·{' '}
                      {e.daysLeft === 1
                        ? 'resta 1 dia'
                        : `restam ${e.daysLeft} dias`}
                    </p>
                  </div>
                  <Button
                    intent="secondary"
                    size="sm"
                    loading={restore.isPending && restore.variables === e}
                    onClick={() => restore.mutate(e)}
                  >
                    <RotateCcw size={14} strokeWidth={1.75} />
                    Restaurar
                  </Button>
                </li>
              ))}
            </ul>
          ))}
      </CardBody>
    </Card>
  );
}
