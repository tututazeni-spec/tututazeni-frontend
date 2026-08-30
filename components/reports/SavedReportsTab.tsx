// components/reports/SavedReportsTab.tsx
// Aba "Meus Relatórios": lista os relatórios personalizados guardados pelo
// utilizador (GET /reports/saved) em cartões, com acções abrir/apagar.
// "Abrir" reconstrói um Template a partir do SavedReport e delega no fluxo
// existente do ReportViewer (via onOpen -> activeTemplate na page).
//
// Nota: o ReportViewer repõe sempre o seu próprio intervalo de datas
// (defaultRange) e não aceita params de entrada — abrir um relatório
// guardado reusa o template/reportKey mas não o from/to gravado.

'use client';

import { Save, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { CAT_CONFIG } from './constants';
import type { SavedReport, Template } from './types';

interface SavedReportsTabProps {
  onOpen: (t: Template) => void;
  onCreate: () => void;
}

function toTemplate(r: SavedReport): Template {
  return {
    id: String(r.id),
    name: r.name,
    category: r.category,
    reportKey: r.reportKey,
    description: r.description ?? '',
  };
}

export function SavedReportsTab({ onOpen, onCreate }: SavedReportsTabProps) {
  const notify = useToast();
  const confirm = useConfirm();

  const {
    data: reports = [],
    isLoading: loading,
    error,
    refetch,
  } = useApiQuery<SavedReport[]>(queryKeys.reports.saved(), '/reports/saved', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  const del = useApiMutation(
    (id: number) => apiClient.delete(`/reports/saved/${id}`),
    {
      invalidateKeys: [queryKeys.reports.saved()],
      onError: () =>
        notify({ title: 'Erro ao apagar relatório.', intent: 'danger' }),
    },
  );

  async function handleDelete(r: SavedReport) {
    const ok = await confirm({
      title: 'Apagar relatório',
      message: `"${r.name}" será removido permanentemente.`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) del.mutate(r.id);
  }

  if (loading) {
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        itemClassName="skeleton-shimmer h-36 rounded-card"
      />
    );
  }

  if (error) {
    return <QueryError error={error} onRetry={() => refetch()} />;
  }

  if (!reports.length) {
    return (
      <EmptyState
        icon={Save}
        title="Sem relatórios guardados"
        description="Cria um relatório personalizado com um template base e um intervalo de datas."
        action={{ label: 'Criar Relatório', onClick: onCreate }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((r) => {
        const cat = CAT_CONFIG[r.category] ?? CAT_CONFIG.HR;
        return (
          <Card key={r.id}>
            <CardBody className="flex h-full flex-col">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="font-display text-sm font-semibold text-ink">
                  {r.name}
                </h4>
                <span
                  className={`shrink-0 font-body text-[10px] font-medium ${cat.color}`}
                >
                  {cat.label}
                </span>
              </div>
              <p className="mb-3 line-clamp-2 flex-1 font-body text-xs text-ink-faint">
                {r.description || 'Sem descrição'}
              </p>
              <p className="mb-3 font-body text-[10px] text-ink-faint">
                Actualizado em {formatDate(r.updatedAt)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 justify-center"
                  onClick={() => onOpen(toTemplate(r))}
                >
                  Abrir
                </Button>
                <Button
                  intent="ghost"
                  size="sm"
                  aria-label={`Apagar ${r.name}`}
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </Button>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
