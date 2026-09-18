// components/courses/PendingEnrollmentsModal.tsx
// Lista e aprova/rejeita pedidos de inscrição de um curso com
// `requiresApproval = true` — secção "2. Botão principal" de
// docs/06-modulo-courses.md ("Curso exige aprovação" → "Solicitar
// inscrição"). Só ADMIN/RH/GESTOR (mesmo RBAC dos endpoints em
// courses.controller.ts).

'use client';

import { Check, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from './shared';

interface PendingEnrollment {
  id: number;
  enrolledAt: string;
  user: { id: number; fullName: string; avatarUrl: string | null };
}

export interface PendingEnrollmentsModalProps {
  courseId: number;
  courseTitle: string;
  onClose: () => void;
}

export function PendingEnrollmentsModal({
  courseId,
  courseTitle,
  onClose,
}: PendingEnrollmentsModalProps) {
  const toast = useToast();
  const key = queryKeys.courses.detail(courseId); // reaproveita invalidação da árvore do curso
  const pending = useApiQuery<PendingEnrollment[]>(
    [...key, 'pending-enrollments'],
    `/courses/${courseId}/enrollments/pending`,
  );

  const approve = useApiMutation(
    (enrollmentId: number) => apiClient.patch(`/courses/enrollments/${enrollmentId}/approve`),
    {
      onSuccess: () => {
        pending.refetch();
        toast({ title: 'Inscrição aprovada', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const reject = useApiMutation(
    (enrollmentId: number) => apiClient.patch(`/courses/enrollments/${enrollmentId}/reject`),
    {
      onSuccess: () => {
        pending.refetch();
        toast({ title: 'Inscrição rejeitada', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const list = pending.data ?? [];

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Pedidos de inscrição pendentes"
        description={courseTitle}
        className="max-w-md max-h-[80vh] overflow-y-auto"
      >
        <div className="mt-4">
          {pending.isLoading ? (
            <Skeleton rows={3} />
          ) : list.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-6">
              Nenhum pedido pendente.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {list.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-card border border-border p-3"
                >
                  <Avatar name={e.user.fullName} url={e.user.avatarUrl ?? undefined} size="sm" />
                  <span className="flex-1 min-w-0 truncate text-sm text-ink">
                    {e.user.fullName}
                  </span>
                  <Button
                    intent="success"
                    size="sm"
                    onClick={() => approve.mutate(e.id)}
                    loading={approve.isPending && approve.variables === e.id}
                    disabled={reject.isPending && reject.variables === e.id}
                  >
                    <Check size={14} strokeWidth={1.75} />
                  </Button>
                  <Button
                    intent="danger"
                    size="sm"
                    onClick={() => reject.mutate(e.id)}
                    loading={reject.isPending && reject.variables === e.id}
                    disabled={approve.isPending && approve.variables === e.id}
                  >
                    <X size={14} strokeWidth={1.75} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
