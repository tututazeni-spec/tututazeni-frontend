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
      <div className="space-y-5">
        {/* Lista — cartões horizontais (desenho trilhas.jpg) */}
        <div className="space-y-3">
          {paths.map((path) => {
            const first = path.steps?.[0];
            return (
              <div
                key={path.id}
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse 22% 140% at 0% 50%, rgba(140,160,198,0.55) 0%, rgba(176,192,222,0.30) 55%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #E9EFFA 0%, #F8FAFE 28%, #F3F7FE 62%, #E3EBFA 100%)',
                }}
                className="grid h-[78px] grid-cols-[auto_minmax(0,1.35fr)_minmax(0,1fr)_auto] items-center gap-x-5 rounded-[16px] border border-brand-line pl-5 pr-4 shadow-[0_6px_24px_rgba(11,61,145,0.10)]"
              >
                <span
                  aria-hidden="true"
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-brand"
                >
                  <Route size={22} strokeWidth={2.25} className="text-white" />
                </span>

                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-[46px] w-[2px] shrink-0 bg-brand"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-body text-[17px] font-bold leading-tight text-brand">
                      {path.name}
                    </div>
                    <div className="mt-0.5 truncate font-body text-xs text-brand-muted">
                      {CAREER_PATH_TYPE[path.type] ?? path.type}
                      <span className="mx-2">|</span>
                      {path.steps?.length ?? 0} cargos
                    </div>
                  </div>
                </div>

                {first ? (
                  <div className="flex h-[52px] min-w-0 items-center gap-3 border-l border-brand-line pl-5">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#2563EB] font-body text-lg font-bold text-white">
                      {first.order}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-body text-sm font-bold leading-tight text-brand">
                        {first.position?.name}
                      </div>
                      {first.minMonthsRequired ? (
                        <div className="mt-0.5 inline-flex items-center gap-1.5 font-body text-xs text-brand-muted">
                          <Clock size={13} strokeWidth={1.75} />
                          {first.minMonthsRequired}m mínimos
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <span />
                )}

                {canManage ? (
                  <button
                    type="button"
                    disabled={deletePath.isPending}
                    onClick={() => handleDelete(path)}
                    className="inline-flex h-[40px] shrink-0 items-center gap-2 rounded-[11px] bg-brand px-5 font-body text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={16} strokeWidth={1.75} /> Apagar
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
          {paths.length === 0 && (
            <EmptyState
              title="Sem trilhas de carreira"
              description="Ainda não há trilhas de carreira configuradas."
            />
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
