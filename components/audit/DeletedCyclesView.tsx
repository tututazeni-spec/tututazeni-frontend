// components/audit/DeletedCyclesView.tsx
// Separador "Apagados" do módulo de auditoria: ciclos de Avaliação 360º
// eliminados (soft delete, GET /evaluation360/cycles/deleted — ADMIN/DIRECTOR,
// ver EVAL_CYCLE_DELETE_ROLES). A linha nunca sai da BD (evaluation360.
// service.ts#deleteCycle), por isso o que aqui aparece são os dados
// completos e reais do ciclo tal como ficou — não um resumo reconstruído a
// partir do AuditLog. Restaurar (POST .../restore) limpa deletedAt e o ciclo
// volta a aparecer no separador "Ciclos" normal.
//
// Extensível a outras entidades com soft delete no futuro — por agora só
// ciclos 360º têm eliminação/restauro implementados.

'use client';

import { Archive, RotateCcw, Trash2, UserRound } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateNumeric, formatDateTimeNumeric } from '@/lib/format';

interface RawDeletedCycle {
  id: string;
  name: string;
  description: string | null;
  model: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  deletedAt: string;
  deletedById: string | null;
  weightSelf: number;
  weightManager: number;
  weightPeer: number;
  weightSubordinate: number;
  weightExternal: number;
  competencies: { competency: { name: string; category: string } }[];
  _count: { participants: number; assignments: number; responses: number };
}

// Mesmo desenho dos contentores de «Gerar relatório» e «Políticas e retenção».
const NAVY_CARD = 'overflow-hidden border-brand/70 bg-brand/70 text-white';

export function DeletedCyclesView() {
  const notify = useToast();
  const confirm = useConfirm();

  const { data, isLoading } = useApiQuery<RawDeletedCycle[]>(
    queryKeys.evaluation360.deletedCycles(),
    '/evaluation360/cycles/deleted',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const restore = useApiMutation<unknown, string>(
    (id) => apiClient.post<unknown>(`/evaluation360/cycles/${id}/restore`),
    {
      invalidateKeys: [
        queryKeys.evaluation360.deletedCycles(),
        queryKeys.evaluation360.cycles(),
      ],
      onSuccess: () => notify({ title: 'Ciclo restaurado', intent: 'success' }),
      onError: () =>
        notify({
          title: 'Não foi possível restaurar o ciclo',
          intent: 'danger',
        }),
    },
  );

  async function handleRestore(c: RawDeletedCycle) {
    const ok = await confirm({
      title: 'Restaurar ciclo de avaliação',
      message: `"${c.name}" volta a aparecer no separador Ciclos da Avaliação 360º, com todos os dados que tinha.`,
      confirmLabel: 'Restaurar',
    });
    if (ok) restore.mutate(c.id);
  }

  if (isLoading) return <Skeleton rows={4} />;

  if (!data || data.length === 0) {
    return (
      <Card className={NAVY_CARD}>
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Trash2 size={16} strokeWidth={1.75} />
          </span>
          <p className="font-body text-sm">
            Sem ciclos de avaliação 360º eliminados.
          </p>
        </div>
      </Card>
    );
  }

return (
    <div className="flex flex-col gap-4">
      <AlertCard
        variant="info"
        title="Ciclos eliminados continuam guardados"
        message="Nada se perde: configuração, competências, participantes e respostas ficam intactos. Ao restaurar, o ciclo volta ao separador Ciclos."
      />
      {data.map((c) => (
        <Card key={c.id} className={NAVY_CARD}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-brand px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Archive size={15} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-base font-semibold leading-tight">
                {c.name}
              </h2>
              <p className="font-body text-xs">
                {c.model} · {c.type} · {formatDateNumeric(c.startDate)} a{' '}
                {formatDateNumeric(c.endDate)}
              </p>
            </div>
            <p className="font-body text-xs">
              <span className="font-semibold">{c._count.participants}</span>{' '}
              participantes ·{' '}
              <span className="font-semibold">{c._count.assignments}</span>{' '}
              atribuições ·{' '}
              <span className="font-semibold">{c._count.responses}</span>{' '}
              respostas
            </p>
            <Button
              className="bg-white text-brand hover:bg-white/90"
              size="sm"
              onClick={() => handleRestore(c)}
            >
              <RotateCcw size={14} strokeWidth={1.75} className="mr-1.5" />
              Restaurar ciclo
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-black/15 px-4 py-2 font-body text-xs">
            <span className="flex items-center gap-1.5">
              <UserRound size={13} strokeWidth={1.75} />
              Criado por #{c.createdBy} em {formatDateNumeric(c.createdAt)}
            </span>
            <span>
              Eliminado em {formatDateTimeNumeric(c.deletedAt)}
              {c.deletedById ? ` por #${c.deletedById}` : ''}
            </span>
            {c.competencies.length > 0 && (
              <span className="flex flex-wrap items-center gap-1">
                {c.competencies.map((cc) => (
                  <span
                    key={cc.competency.name}
                    className="rounded-full border border-white/40 px-2 py-px"
                  >
                    {cc.competency.name}
                  </span>
                ))}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
