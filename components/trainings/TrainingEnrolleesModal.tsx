// components/trainings/TrainingEnrolleesModal.tsx
// Abre ao clicar numa formação de "Mais populares" (Visão Geral): lista os
// colaboradores inscritos. GET /trainings/:id/participants (Admin/RH/…).

'use client';

import { AlertCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import {
  DETAIL_NAVY,
  detailInitials,
  detailTint,
} from '@/components/ui/DetailCardParts';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

interface Enrollee {
  id: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    department: { name: string } | null;
  };
}

export interface TrainingEnrolleesModalProps {
  trainingId: number;
  title: string;
  onClose: () => void;
}

export function TrainingEnrolleesModal({
  trainingId,
  title,
  onClose,
}: TrainingEnrolleesModalProps) {
  const { data, isLoading, error } = useApiQuery<Enrollee[]>(
    ['trainings', 'enrollees', trainingId],
    `/trainings/${trainingId}/participants`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Inscritos — ${title}`}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {isLoading ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : error || !data ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar os inscritos.
          </div>
        ) : data.length === 0 ? (
          <p className="mt-5 font-body text-sm text-ink-faint">
            Ainda não há inscritos nesta formação.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                {p.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.user.avatarUrl}
                    alt={p.user.fullName}
                    className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: DETAIL_NAVY }}
                  >
                    {detailInitials(p.user.fullName)}
                  </span>
                )}
                <div className="min-w-0">
                  <div
                    className="truncate font-body text-sm font-medium"
                    style={{ color: DETAIL_NAVY }}
                  >
                    {p.user.fullName}
                  </div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {p.user.department?.name ?? p.user.email}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div
          className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4"
          style={{ borderColor: detailTint(20) }}
        >
          <span className="font-body text-xs text-ink-faint">
            {data ? `${data.length} inscritos` : ''}
          </span>
          <Button intent="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
