// components/competencies/LevelsView.tsx
// Separador "Níveis de Proficiência" (docs/módulo_competencies.md §3,
// Fase 2). Níveis continuam por-competência (ver
// docs/superpowers/specs/2026-09-25-competencies-fase2-design.md,
// decisão 1) — esta aba lista/gere o que já existe em GET
// /competencies/proficiency-levels, agrupado por competência.

'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG, STATUS_CFG } from './constants';
import { LevelFormModal } from './LevelFormModal';
import { useCompetencyOptions } from './modelFormData';
import type { ProficiencyLevelWithCompetency } from './types';

interface LevelsViewProps {
  canManage: boolean;
}

export function LevelsView({ canManage }: LevelsViewProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const { options: competencyOptions } = useCompetencyOptions();

  const [competencyId, setCompetencyId] = useState('ALL');
  const [form, setForm] = useState<
    | { mode: 'create' }
    | { mode: 'edit'; level: ProficiencyLevelWithCompetency }
    | null
  >(null);

  const params = { competencyId: competencyId === 'ALL' ? '' : competencyId };
  const { data, isLoading } = useApiQuery<ProficiencyLevelWithCompetency[]>(
    queryKeys.competencies.levels(params),
    '/competencies/proficiency-levels',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const remove = useApiMutation(
    (levelId: number) => apiClient.delete(`/competencies/proficiency-levels/${levelId}`),
    {
      invalidateKeys: [queryKeys.competencies.all],
      onSuccess: () => toast({ title: 'Nível eliminado.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(level: ProficiencyLevelWithCompetency) {
    const ok = await confirm({
      title: `Eliminar nível "${level.name}"?`,
      message: `Nível ${level.value} da competência "${level.competency.name}". Esta acção é irreversível.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(level.id);
  }

  const grouped = useMemo(() => {
    const map = new Map<number, ProficiencyLevelWithCompetency[]>();
    for (const lvl of data ?? []) {
      const list = map.get(lvl.competencyId) ?? [];
      list.push(lvl);
      map.set(lvl.competencyId, list);
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          items={[{ value: 'ALL', label: 'Todas as competências' }, ...competencyOptions]}
          value={competencyId}
          onValueChange={setCompetencyId}
          className="min-w-[220px]"
        />
        {canManage && (
          <Button onClick={() => setForm({ mode: 'create' })}>
            <Plus size={16} strokeWidth={1.75} className="mr-1.5" />
            Novo nível
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={6} />
      ) : grouped.length === 0 ? (
        <EmptyState
          title="Nenhum nível de proficiência definido"
          description="Cria níveis para descrever o que significa estar em cada patamar de uma competência."
        />
      ) : (
        <div className="space-y-4">
          {grouped.map((levels) => (
            <div
              key={levels[0].competencyId}
              className="overflow-hidden rounded-card border border-border bg-surface"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="font-body text-sm font-semibold text-ink">
                  {levels[0].competency.name}
                </div>
                <StatusBadge value={levels[0].competency.category} map={CATEGORY_CFG} />
              </div>
              {levels
                .sort((a, b) => a.value - b.value)
                .map((lvl) => (
                  <div
                    key={lvl.id}
                    className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
                  >
                    <span className="w-6 text-center font-data text-sm font-bold text-ink-faint">
                      {lvl.value}
                    </span>
                    <div className="flex-1">
                      <div className="font-body text-sm font-medium text-ink">
                        {lvl.name}
                        {lvl.code && (
                          <span className="ml-1.5 font-body text-xs font-normal text-ink-faint">
                            {lvl.code}
                          </span>
                        )}
                      </div>
                      {lvl.description && (
                        <div className="font-body text-xs text-ink-faint">{lvl.description}</div>
                      )}
                    </div>
                    {(lvl.minScore != null || lvl.maxScore != null) && (
                      <span className="font-data text-xs text-ink-muted">
                        {lvl.minScore ?? '—'}–{lvl.maxScore ?? '—'} pts
                      </span>
                    )}
                    <StatusBadge value={lvl.status} map={STATUS_CFG} />
                    {canManage && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="Editar nível"
                          onClick={() => setForm({ mode: 'edit', level: lvl })}
                          className="rounded p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink"
                        >
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar nível"
                          onClick={() => onDelete(lvl)}
                          className="rounded p-1.5 text-ink-faint hover:bg-danger-subtle hover:text-danger-ink"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {form && (
        <LevelFormModal
          level={form.mode === 'edit' ? form.level : null}
          competencyId={competencyId !== 'ALL' ? parseInt(competencyId, 10) : null}
          onClose={() => setForm(null)}
          onSuccess={() =>
            toast({
              title: form.mode === 'edit' ? 'Nível actualizado.' : 'Nível criado.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
