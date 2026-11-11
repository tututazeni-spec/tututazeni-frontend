// components/competencies/CompetencyDetailModal.tsx
// Abre ao clicar num cartão do catálogo. Leitura aberta a qualquer
// utilizador autenticado — GET /competencies/:id não tem @Roles. As acções
// de gestão no rodapé (Editar / Arquivar / Reactivar) só aparecem quando
// `canManage` (ADMIN/RH), espelhando @Roles(ADMIN, RH) em
// competencies.controller.ts. "Apagar" é mais restrito — só aparece com
// `canDelete` (ADMIN), espelhando @Roles(ADMIN) no DELETE /competencies/:id.
//
// Desenho: igual à ficha do Formador (TrainerDetailModal), via as peças
// partilhadas de ui/DetailCardParts.
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

import type { CSSProperties } from 'react';
import {
  AlertCircle,
  FileText,
  Hash,
  Layers,
  Tag,
  Target,
  UserCog,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
  detailTint,
} from '@/components/ui/DetailCardParts';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cardSolidColor } from './cardColors';
import { CATEGORY_CFG } from './constants';
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
        hideHeading
        navyClose
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        // As peças de DetailCardParts pintam o azul marinho com esta variável:
        // aqui passa a ser a cor do cartão da competência no catálogo.
        style={
          {
            '--color-brand-ink': cardSolidColor(competencyId),
            '--color-brand': cardSolidColor(competencyId),
            '--color-brand-hover': cardSolidColor(competencyId),
            '--color-brand-active': cardSolidColor(competencyId),
          } as CSSProperties
        }
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
            <DetailHeader name={data.name}>
              <StatusBadge value={data.category} map={CATEGORY_CFG} />
            </DetailHeader>

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-4">
                <DetailInfoRow icon={Hash} label="Código">
                  {data.code || '—'}
                </DetailInfoRow>
                <DetailInfoRow icon={Layers} label="Família">
                  {data.family || '—'}
                </DetailInfoRow>
                <DetailInfoRow
                  icon={UserCog}
                  label="Responsável pela competência"
                >
                  {data.owner?.fullName ?? '—'}
                </DetailInfoRow>
              </div>

              <DetailDivider />

              <div className="space-y-4">
                <DetailSectionRow icon={FileText} label="Descrição">
                  <span className="whitespace-pre-wrap">
                    {data.description || '—'}
                  </span>
                </DetailSectionRow>
                <DetailSectionRow icon={Target} label="Objetivo">
                  <span className="whitespace-pre-wrap">
                    {data.objective || '—'}
                  </span>
                </DetailSectionRow>
                <DetailSectionRow icon={Tag} label="Tags">
                  {data.tags.length === 0 ? (
                    '—'
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {data.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-3 py-0.5 text-xs text-ink"
                          style={{ backgroundColor: detailTint(8) }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </DetailSectionRow>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
              <div>
                {canManage && canDelete && (
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
                <Button intent="secondary" onClick={onClose}>
                  Fechar
                </Button>
                {canManage && (
                  <>
                    <Button onClick={onEdit} disabled={busy}>
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
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
