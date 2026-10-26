// components/career/PathsView.tsx
// Separador "Trilhas" — lista + detalhe (passos/cargos) de uma trilha
// de carreira. Dados próprios + apresentação. Extraído de
// app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { Clock, Plus, Route, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { EXECUTIVE_ROLES, isRoleAllowed, type Role } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CAREER_PATH_TYPE } from './constants';
import { NewCareerPathModal } from './NewCareerPathModal';
import type { CareerPath } from './types';

export function PathsView() {
  const [selected, setSelected] = useState<CareerPath | null>(null);
  const [showNew, setShowNew] = useState(false);
  const notify = useToast();
  const confirm = useConfirm();
  const { data: me } = useCurrentUser();
  const canManage = isRoleAllowed(
    EXECUTIVE_ROLES,
    me?.role?.name as Role | undefined,
  );
  const {
    data: paths = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<CareerPath[]>(queryKeys.career.paths(), '/career/paths', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  const deletePath = useApiMutation(
    (id: number) => apiClient.delete(`/career/paths/${id}`),
    {
      invalidateKeys: [queryKeys.career.paths()],
      onSuccess: () => {
        setSelected(null);
        notify({ title: 'Percurso de carreira apagado', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleDelete = async (path: CareerPath) => {
    const ok = await confirm({
      title: 'Apagar percurso de carreira',
      message: `Tem a certeza que quer apagar "${path.name}"? Esta acção remove o percurso da lista.`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) deletePath.mutate(path.id);
  };

  if (loading) return <Skeleton />;

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus size={14} strokeWidth={1.75} /> Novo Percurso de Carreira
          </Button>
        </div>
      )}
      <div className="grid grid-cols-[300px_1fr] gap-5">
        {/* Lista */}
        <div className="space-y-2">
          {paths.map((path) => (
            <div
              key={path.id}
              onClick={() => setSelected(path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(path);
                }
              }}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[18px] border p-4 shadow-[0_8px_30px_rgba(11,61,145,0.10)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50',
                selected?.id === path.id
                  ? 'border-transparent bg-gradient-to-br from-brand-mid to-brand-dark text-white'
                  : 'border-brand-line bg-surface text-brand hover:border-[#0D6EFD]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-control',
                  selected?.id === path.id ? 'bg-[#075FE8]' : 'bg-brand-soft',
                )}
              >
                <Route
                  size={18}
                  strokeWidth={1.75}
                  fill="#FFFFFF"
                  stroke="#0F1F3D"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-semibold">
                  {path.name}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 font-body text-xs opacity-70">
                  <span>{CAREER_PATH_TYPE[path.type] ?? path.type}</span>
                  <span>{path.steps?.length ?? 0} cargos</span>
                </div>
              </div>
            </div>
          ))}
          {paths.length === 0 && (
            <EmptyState
              title="Sem trilhas de carreira"
              description="Ainda não há trilhas de carreira configuradas."
            />
          )}
        </div>

        {/* Detalhe */}
        <div>
          {!selected ? (
            <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
              Selecciona uma trilha
            </div>
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-brand-mid to-brand-dark px-6 py-4 text-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Route size={20} strokeWidth={1.75} />
                    <h3 className="truncate font-body text-sm font-semibold uppercase tracking-wider">
                      {selected.name}
                    </h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 font-body text-xs text-white/85">
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                      {CAREER_PATH_TYPE[selected.type] ?? selected.type}
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                      {selected.steps.length} passos
                    </span>
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    disabled={deletePath.isPending}
                    onClick={() => handleDelete(selected)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> Apagar
                  </button>
                )}
              </div>

              <div className="p-6">
                {selected.description && (
                  <p className="mb-5 font-body text-sm text-brand/70">
                    {selected.description}
                  </p>
                )}

                {/* Passos / Cargos */}
                <div className="space-y-3">
                  {selected.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-[#075FE8] font-body text-sm font-bold text-white">
                          {step.order}
                        </div>
                        {idx < selected.steps.length - 1 && (
                          <div className="mt-1 h-6 w-0.5 bg-brand-line" />
                        )}
                      </div>
                      <div className="flex-1 rounded-card border border-brand-line bg-brand-soft/50 p-3">
                        <div className="font-body text-sm font-semibold text-brand">
                          {step.position?.name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 font-body text-xs text-brand/60">
                          {step.minMonthsRequired && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} strokeWidth={1.75} />{' '}
                              {step.minMonthsRequired}m mínimos
                            </span>
                          )}
                          {step.minPerformanceScore && (
                            <span> Score ≥{step.minPerformanceScore}</span>
                          )}
                          {(step.requiredCourseIds?.length ?? 0) > 0 && (
                            <span>
                              {step.requiredCourseIds?.length} cursos
                              obrigatórios
                            </span>
                          )}
                        </div>
                        {(step.position?.competencies?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {step.position?.competencies
                              ?.slice(0, 4)
                              .map((pc) => (
                                <span
                                  key={pc.competency.id}
                                  className="rounded-full bg-[#075FE8] px-2 py-0.5 font-body text-xs text-white"
                                >
                                  {pc.competency.name}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewCareerPathModal
          onClose={() => setShowNew(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
