// components/competencies/LevelsView.tsx
// Separador "Níveis de Proficiência" (docs/módulo_competencies.md §3,
// Fase 2). Níveis continuam por-competência (ver
// docs/superpowers/specs/2026-09-25-competencies-fase2-design.md,
// decisão 1) — esta aba lista/gere o que já existe em GET
// /competencies/proficiency-levels, agrupado por competência.

'use client';

import { useMemo, useState } from 'react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG, STATUS_CFG } from './constants';
import { LevelDetailModal } from './LevelDetailModal';
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
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<ProficiencyLevelWithCompetency | null>(
    null,
  );
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
    (levelId: number) =>
      apiClient.delete(`/competencies/proficiency-levels/${levelId}`),
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
    const norm = (t: string) =>
      t
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
    const q = norm(search);
    return Array.from(map.values()).filter(
      (levels) => !q || norm(levels[0].competency.name).includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput
            variant="underline"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar competência…"
            aria-label="Pesquisar competência"
            className="min-w-[220px]"
          />
          <Select
            variant="underline"
            icon={Layers}
            items={[
              { value: 'ALL', label: 'Todas as competências' },
              ...competencyOptions,
            ]}
            value={competencyId}
            onValueChange={setCompetencyId}
            className="min-w-[220px]"
          />
        </div>
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
            <div key={levels[0].competencyId} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="font-body text-sm font-semibold text-brand">
                  {levels[0].competency.name}
                </div>
                <StatusBadge
                  value={levels[0].competency.category}
                  map={CATEGORY_CFG}
                />
              </div>
              {[...levels]
                .sort((a, b) => a.value - b.value)
                .map((lvl) => (
                  <div
                    key={lvl.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalhes do nível ${lvl.name}`}
                    onClick={() => setDetail(lvl)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetail(lvl);
                      }
                    }}
                    className="relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-[18px] border border-brand-line bg-surface px-4 py-[11px] shadow-[0_4px_12px_rgba(21,47,89,0.10)] transition hover:border-brand"
                  >
                    <span className="w-6 text-center font-data text-sm font-bold text-brand-muted">
                      {lvl.value}
                    </span>
                    <div className="min-w-0 flex-1 truncate font-body text-sm text-brand">
                      <span className="font-semibold">{lvl.name}</span>
                      {lvl.code && (
                        <span className="ml-1.5 text-xs text-brand-muted">
                          {lvl.code}
                        </span>
                      )}
                      {lvl.description && (
                        <span
                          className="ml-2 text-xs text-brand-muted"
                          title={lvl.description}
                        >
                          {lvl.description}
                        </span>
                      )}
                    </div>
                    {(lvl.minScore != null || lvl.maxScore != null) && (
                      <span className="font-body text-xs font-semibold text-brand">
                        {lvl.minScore ?? '—'}–{lvl.maxScore ?? '—'} pts
                      </span>
                    )}
                    <StatusBadge value={lvl.status} map={STATUS_CFG} />
                    {canManage && (
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          icon={Pencil}
                          label="Editar nível"
                          intent="ghost"
                          size="xs"
                          type="button"
                          onClick={() => setForm({ mode: 'edit', level: lvl })}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Eliminar nível"
                          intent="ghostDanger"
                          size="xs"
                          type="button"
                          onClick={() => onDelete(lvl)}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {detail && (
        <LevelDetailModal level={detail} onClose={() => setDetail(null)} />
      )}

      {form && (
        <LevelFormModal
          level={form.mode === 'edit' ? form.level : null}
          competencyId={
            competencyId !== 'ALL' ? parseInt(competencyId, 10) : null
          }
          onClose={() => setForm(null)}
          onSuccess={() =>
            toast({
              title:
                form.mode === 'edit' ? 'Nível actualizado.' : 'Nível criado.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
