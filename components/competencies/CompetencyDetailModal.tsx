// components/competencies/CompetencyDetailModal.tsx
// Abre ao clicar num cartão do catálogo. Leitura aberta a qualquer
// utilizador autenticado — GET /competencies/:id não tem @Roles. As acções
// de gestão no rodapé (Editar / Arquivar / Reactivar) só aparecem quando
// `canManage` (ADMIN/RH), espelhando @Roles(ADMIN, RH) em
// competencies.controller.ts. "Apagar" é mais restrito — só aparece com
// `canDelete` (ADMIN), espelhando @Roles(ADMIN) no DELETE /competencies/:id.
//
// Arquivar → PATCH /competencies/:id/archive (status = INACTIVE).
// Reactivar → PUT /competencies/:id { status: 'ACTIVE' } (não há endpoint
// dedicado; o update parcial serve).
// Apagar → DELETE /competencies/:id. É permanente e irreversível (ao
// contrário de arquivar). O backend recusa (400) se houver utilizadores
// associados; o botão já aparece desativado nesse caso, com o toast de erro
// a servir de rede de segurança. Todos invalidam ['competencies'] para o
// catálogo e o dashboard refrescarem.

'use client';

import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG, LEVEL_LABELS } from './constants';
import type { CompetencyDetail } from './types';

export interface CompetencyDetailModalProps {
  competencyId: number;
  canManage: boolean;
  /** ADMIN: mostra a acção "Apagar" (DELETE /competencies/:id é @Roles(ADMIN)). */
  canDelete: boolean;
  onEdit: () => void;
  onClose: () => void;
}

export function CompetencyDetailModal({
  competencyId,
  canManage,
  canDelete,
  onEdit,
  onClose,
}: CompetencyDetailModalProps) {
  const confirm = useConfirm();
  const toast = useToast();

  const { data, isLoading, error } = useApiQuery<CompetencyDetail>(
    queryKeys.competencies.detail(competencyId),
    `/competencies/${competencyId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [
    queryKeys.competencies.all,
    queryKeys.competencies.detail(competencyId),
  ];
  const toastError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });

  const archive = useApiMutation(
    () => apiClient.patch(`/competencies/${competencyId}/archive`),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Competência arquivada.', intent: 'success' });
        onClose();
      },
      onError: toastError,
    },
  );
  const reactivate = useApiMutation(
    () => apiClient.put(`/competencies/${competencyId}`, { status: 'ACTIVE' }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Competência reactivada.', intent: 'success' });
        onClose();
      },
      onError: toastError,
    },
  );
  const remove = useApiMutation(
    () => apiClient.delete(`/competencies/${competencyId}`),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Competência eliminada.', intent: 'success' });
        onClose();
      },
      onError: toastError,
    },
  );
  const busy = archive.isPending || reactivate.isPending || remove.isPending;

  async function onArchive() {
    const ok = await confirm({
      title: `Arquivar "${data?.name}"?`,
      message:
        'Deixa de aparecer no catálogo activo. Os perfis de utilizadores mantêm-se.',
      confirmLabel: 'Arquivar',
      destructive: true,
    });
    if (ok) archive.mutate(undefined);
  }

  async function onDelete() {
    const ok = await confirm({
      title: `Eliminar "${data?.name}"?`,
      message:
        'A competência é apagada de forma permanente e irreversível. Para a remover do catálogo sem perder o registo, arquive-a em vez de eliminar.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(undefined);
  }

  const archived = data?.status === 'INACTIVE';
  const usersAttached = (data?._count.userCompetencies ?? 0) > 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.name ?? 'Competência'}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {isLoading ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : error || !data ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar a competência.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={data.category} map={CATEGORY_CFG} />
                {archived && (
                  <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted">
                    Arquivada
                  </span>
                )}
              </div>

              {data.description && (
                <p className="font-body text-sm text-ink-muted">
                  {data.description}
                </p>
              )}

              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-4 font-body text-xs text-ink-faint">
                <span>{data._count.userCompetencies} utilizadores</span>
                <span>{data._count.endorsements} endorsements</span>
              </div>

              {data.proficiencyLevels.length > 0 && (
                <Section title="Níveis de proficiência">
                  <ul className="space-y-1">
                    {data.proficiencyLevels.map((lvl) => (
                      <li
                        key={lvl.id}
                        className="font-body text-sm text-ink-muted"
                      >
                        <span className="font-semibold text-ink">
                          {lvl.value}. {lvl.name}
                        </span>
                        {lvl.description ? ` — ${lvl.description}` : ''}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {data.courses.length > 0 && (
                <Section
                  title={`Cursos que a desenvolvem (${data.courses.length})`}
                >
                  <ul className="space-y-1">
                    {data.courses.map((c) => (
                      <li
                        key={c.id}
                        className="font-body text-sm text-ink-muted"
                      >
                        {c.course.title}
                        <span className="text-ink-faint">
                          {' '}
                          · nível {LEVEL_LABELS[c.levelGained] ?? c.levelGained}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {data.positions.length > 0 && (
                <Section
                  title={`Cargos que a exigem (${data.positions.length})`}
                >
                  <ul className="space-y-1">
                    {data.positions.map((p) => (
                      <li
                        key={p.id}
                        className="font-body text-sm text-ink-muted"
                      >
                        {p.position?.name ?? 'Cargo'}
                        <span className="text-ink-faint">
                          {' '}
                          · requer{' '}
                          {LEVEL_LABELS[p.requiredLevel] ?? p.requiredLevel}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {canManage && (
              <div className="mt-6 flex items-start justify-between gap-3 border-t border-border pt-4">
                <div>
                  {canDelete && (
                    <>
                      <Button
                        intent="danger"
                        onClick={onDelete}
                        loading={remove.isPending}
                        disabled={busy || usersAttached}
                      >
                        Apagar
                      </Button>
                      {usersAttached && (
                        <p className="mt-1.5 max-w-[16rem] font-body text-xs text-ink-faint">
                          Tem {data._count.userCompetencies} utilizadores
                          associados — arquive em vez de eliminar.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button intent="ghost" onClick={onEdit} disabled={busy}>
                    Editar
                  </Button>
                  {archived ? (
                    <Button
                      intent="secondary"
                      onClick={() => reactivate.mutate(undefined)}
                      loading={reactivate.isPending}
                      disabled={busy}
                    >
                      Reactivar
                    </Button>
                  ) : (
                    <Button
                      intent="danger"
                      onClick={onArchive}
                      loading={archive.isPending}
                      disabled={busy}
                    >
                      Arquivar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      {children}
    </div>
  );
}
