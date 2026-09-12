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

import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

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
        notify({ title: 'Não foi possível restaurar o ciclo', intent: 'danger' }),
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
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-ink-muted">
        Sem ciclos de avaliação 360º eliminados.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-xs text-ink-faint">
        Eliminação de ciclos é soft delete: o registo (config, competências,
        participantes, respostas) continua completo na base de dados — só
        fica escondido do separador Ciclos até ser restaurado.
      </p>
      {data.map((c) => (
        <div key={c.id} className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">{c.name}</div>
              <div className="mt-0.5 text-xs text-ink-muted">
                {c.model} · {c.type} · {c.startDate.slice(0, 10)} →{' '}
                {c.endDate.slice(0, 10)}
              </div>
              <div className="mt-1 text-xs text-danger-ink">
                Eliminado em {new Date(c.deletedAt).toLocaleString('pt-PT')}
                {c.deletedById ? ` · por utilizador #${c.deletedById}` : ''}
              </div>
            </div>
            <Button intent="secondary" size="sm" onClick={() => handleRestore(c)}>
              Restaurar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted sm:grid-cols-4">
            <div>
              <span className="font-semibold text-ink">{c._count.participants}</span>{' '}
              participantes
            </div>
            <div>
              <span className="font-semibold text-ink">{c._count.assignments}</span>{' '}
              atribuições
            </div>
            <div>
              <span className="font-semibold text-ink">{c._count.responses}</span>{' '}
              respostas
            </div>
            <div>
              Criado por utilizador #{c.createdBy} em{' '}
              {new Date(c.createdAt).toLocaleDateString('pt-PT')}
            </div>
          </div>

          {c.competencies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.competencies.map((cc) => (
                <span
                  key={cc.competency.name}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-muted"
                >
                  {cc.competency.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
