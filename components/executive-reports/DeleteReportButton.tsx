// components/executive-reports/DeleteReportButton.tsx
// Botão "Eliminar" de um relatório já criado (Histórico e Arquivo). O backend
// recusa eliminar relatórios publicados, por isso o botão não aparece nesse caso.

'use client';

import { Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';

interface DeleteReportButtonProps {
  reportId: number;
  status: string;
  onDeleted?: () => void;
}

export function DeleteReportButton({
  reportId,
  status,
  onDeleted,
}: DeleteReportButtonProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const mutation = useApiMutation(
    () => apiClient.delete(`/executive-reports/${reportId}`),
    {
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: () => {
        notify({ title: 'Relatório eliminado', intent: 'success' });
        onDeleted?.();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  if (status === 'PUBLISHED') return null;

  const handleClick = async () => {
    const ok = await confirm({
      title: 'Eliminar este relatório?',
      message:
        'O relatório e todos os seus KPIs serão apagados definitivamente. Esta acção não pode ser revertida.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) mutation.mutate(undefined);
  };

  return (
    <Button
      intent="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        void handleClick();
      }}
      disabled={mutation.isPending}
      className="text-ink"
    >
      <Trash2 size={14} strokeWidth={1.75} />
      Eliminar
    </Button>
  );
}
