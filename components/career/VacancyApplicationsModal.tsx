// components/career/VacancyApplicationsModal.tsx
// Modal "Candidaturas" (RH/Gestor/Admin) — Módulo Career, secção 5.
// Revê/aceita/rejeita candidatos de uma vaga interna
// (GET + PATCH /career/vacancies/:id/applications*). Antes desta modal,
// PATCH /career/vacancies/applications/:appId/status não tinha nenhum
// caminho de leitura no frontend — RH não conseguia ver quem se
// candidatou.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import type { VacancyApplication } from './types';

const STATUS_INTENT: Record<VacancyApplication['status'], 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  PENDING: 'neutral',
  REVIEWING: 'info',
  SHORTLISTED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

const STATUS_LABEL: Record<VacancyApplication['status'], string> = {
  PENDING: 'Pendente',
  REVIEWING: 'Em revisão',
  SHORTLISTED: 'Pré-seleccionado',
  ACCEPTED: 'Aceite',
  REJECTED: 'Rejeitado',
};

export interface VacancyApplicationsModalProps {
  vacancyId: number;
  vacancyTitle: string;
  onClose: () => void;
}

export function VacancyApplicationsModal({
  vacancyId,
  vacancyTitle,
  onClose,
}: VacancyApplicationsModalProps) {
  const {
    data: applications = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<VacancyApplication[]>(
    queryKeys.career.vacancyApplications(vacancyId),
    `/career/vacancies/${vacancyId}/applications`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={`Candidaturas — ${vacancyTitle}`} className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <div className="mt-4">
          {loading ? (
            <Skeleton rows={3} />
          ) : applications.length === 0 ? (
            <EmptyState title="Sem candidaturas" description="Ainda ninguém se candidatou a esta vaga." />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationRow key={app.id} app={app} onChanged={() => refetch()} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function ApplicationRow({ app, onChanged }: { app: VacancyApplication; onChanged: () => void }) {
  const [feedback, setFeedback] = useState(app.feedback ?? '');
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState('');

  const updateStatus = useApiMutation(
    (status: VacancyApplication['status']) =>
      apiClient.patch(`/career/vacancies/applications/${app.id}/status`, {
        status,
        feedback: feedback || undefined,
      }),
    {
      onSuccess: () => {
        setShowFeedback(false);
        onChanged();
      },
      onError: (e) => setError(e.message),
    },
  );

  return (
    <div className="rounded-card border border-border p-3">
      <div className="flex items-start gap-3">
        <Avatar name={app.user.fullName} url={app.user.avatarUrl ?? undefined} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-body text-sm font-medium text-ink">
              {app.user.fullName}
            </span>
            <Badge intent={STATUS_INTENT[app.status]}>{STATUS_LABEL[app.status]}</Badge>
          </div>
          <div className="font-body text-xs text-ink-faint">
            {app.user.position?.name ?? '—'} · {app.user.department?.name ?? '—'}
          </div>
          {app.motivation && (
            <p className="mt-2 font-body text-xs text-ink-muted">{app.motivation}</p>
          )}

          {error && (
            <div className="mt-2 flex items-center gap-1.5 font-body text-xs text-danger-ink">
              <AlertCircle size={13} strokeWidth={1.75} />
              {error}
            </div>
          )}

          {showFeedback && (
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Feedback para o candidato (opcional)"
              rows={2}
              className="mt-2 w-full resize-none"
            />
          )}

          {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                intent="secondary"
                onClick={() => setShowFeedback((v) => !v)}
              >
                Feedback
              </Button>
              {app.status === 'PENDING' && (
                <Button
                  size="sm"
                  intent="secondary"
                  onClick={() => {
                    setError('');
                    updateStatus.mutate('REVIEWING');
                  }}
                  loading={updateStatus.isPending && updateStatus.variables === 'REVIEWING'}
                >
                  Marcar em revisão
                </Button>
              )}
              <Button
                size="sm"
                intent="secondary"
                onClick={() => {
                  setError('');
                  updateStatus.mutate('SHORTLISTED');
                }}
                loading={updateStatus.isPending && updateStatus.variables === 'SHORTLISTED'}
              >
                Pré-seleccionar
              </Button>
              <Button
                size="sm"
                intent="success"
                onClick={() => {
                  setError('');
                  updateStatus.mutate('ACCEPTED');
                }}
                loading={updateStatus.isPending && updateStatus.variables === 'ACCEPTED'}
              >
                Aceitar
              </Button>
              <Button
                size="sm"
                intent="danger"
                onClick={() => {
                  setError('');
                  updateStatus.mutate('REJECTED');
                }}
                loading={updateStatus.isPending && updateStatus.variables === 'REJECTED'}
              >
                Rejeitar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
