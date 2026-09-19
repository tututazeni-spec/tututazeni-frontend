// components/evaluation/CriteriaTab.tsx
// Separador "Critérios" (docs/modulo_evaluation.md pt.5) — biblioteca
// central de critérios reutilizáveis entre modelos de avaliação. Leitura
// aberta a MGMT_ROLES (espelha @Roles no backend); criar/editar/desactivar
// restrito a ADMIN_ROLES, tal como CyclesTab/EvaluationsTab.

'use client';

import { useState } from 'react';
import { Pencil, Plus, Power } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ADMIN_ROLES } from '@/lib/roles';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { CriteriaFormModal } from './CriteriaFormModal';
import type { EvalCriteria } from './types';

export function CriteriaTab() {
  const role = useCurrentRole();
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const notify = useToast();
  const confirm = useConfirm();

  const criteriaParams = { includeInactive: 'true' };
  const { data: criteria = [], isLoading: loading } = useApiQuery<EvalCriteria[]>(
    queryKeys.evaluation.criteria(criteriaParams),
    '/evaluations/criteria',
    { params: criteriaParams, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const [editing, setEditing] = useState<EvalCriteria | null | undefined>(undefined);

  const toggleActive = useApiMutation(
    (c: EvalCriteria) => apiClient.patch(`/evaluations/criteria/${c.id}`, { isActive: !c.isActive }),
    {
      invalidateKeys: [queryKeys.evaluation.criteria()],
      onSuccess: () => notify({ title: 'Estado do critério actualizado', intent: 'success' }),
    },
  );

  const remove = async (c: EvalCriteria) => {
    if (
      await confirm({
        title: `Remover "${c.name}"?`,
        message: 'O critério deixa de estar disponível para novos modelos, mas não afecta avaliações já criadas.',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      try {
        await apiClient.delete(`/evaluations/criteria/${c.id}`);
        notify({ title: 'Critério removido', intent: 'success' });
      } catch {
        notify({ title: 'Não foi possível remover o critério', intent: 'danger' });
      }
    }
  };

  if (loading)
    return (
      <Skeleton rows={4} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-14 rounded-card" />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">
          Critérios — Biblioteca Central
        </h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus size={16} strokeWidth={1.75} /> Novo Critério
          </Button>
        )}
      </div>

      {criteria.length === 0 ? (
        <EmptyState
          title="Sem critérios criados"
          description="Cria o primeiro critério para o usar em modelos de avaliação."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              {['Nome', 'Código', 'Categoria', 'Peso', 'Escala', 'Estado', ''].map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {criteria.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium text-ink">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-ink-faint line-clamp-1">{c.description}</div>
                  )}
                </TableCell>
                <TableCell className="text-ink-muted">{c.code ?? '—'}</TableCell>
                <TableCell className="text-ink-muted">{c.category ?? '—'}</TableCell>
                <TableCell className="text-ink-muted">{c.weight}</TableCell>
                <TableCell className="text-ink-muted">{c.scale?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge intent={c.isActive ? 'success' : 'neutral'}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isAdmin && (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        intent="ghost"
                        aria-label={`Editar ${c.name}`}
                        onClick={() => setEditing(c)}
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </Button>
                      <Button
                        size="sm"
                        intent="ghost"
                        aria-label={`${c.isActive ? 'Desactivar' : 'Activar'} ${c.name}`}
                        onClick={() => toggleActive.mutate(c)}
                      >
                        <Power size={14} strokeWidth={1.75} />
                      </Button>
                      <Button
                        size="sm"
                        intent="ghost"
                        aria-label={`Remover ${c.name}`}
                        onClick={() => remove(c)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editing !== undefined && (
        <CriteriaFormModal criteria={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
