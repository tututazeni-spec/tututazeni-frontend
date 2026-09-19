// components/trainings/manage/HistoryTab.tsx
// Separador "Histórico" (docs/trainings-detalhado.md pt.11 — criação,
// alterações, agendamento, inscrições, sessões, presenças, avaliações,
// conclusão). GET /trainings/:id/history lê directamente o AuditLog
// (entity='Training') — ver TrainingService.getHistory/logHistory.

'use client';

import { History } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrainingHistoryEntry } from '../types';

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Formação criada',
  UPDATE: 'Formação actualizada',
  PUBLISH: 'Formação publicada',
  ARCHIVE: 'Formação arquivada',
  CANCEL: 'Formação cancelada',
  COMPLETE: 'Formação concluída',
  DELETE: 'Formação eliminada',
  SESSION_CREATE: 'Sessão agendada',
  SESSION_UPDATE: 'Sessão actualizada',
  SESSION_REMOVE: 'Sessão eliminada',
  PARTICIPANT_REGISTER: 'Inscrição',
  PARTICIPANT_CANCEL: 'Inscrição cancelada',
  PARTICIPANT_APPROVE: 'Inscrição aprovada',
  PARTICIPANT_REJECT: 'Inscrição rejeitada',
  PARTICIPANT_STATUS_UPDATE: 'Presença registada',
  PARTICIPANT_COMPLETE: 'Participante concluiu',
  BULK_ATTENDANCE: 'Presença em massa registada',
  RATE: 'Avaliação (estrelas) submetida',
  DOCUMENT_ADD: 'Documento adicionado',
  ASSESSMENT_LINK: 'Avaliação associada',
};

interface HistoryTabProps {
  trainingId: number;
}

export function HistoryTab({ trainingId }: HistoryTabProps) {
  const { data, isLoading } = useApiQuery<TrainingHistoryEntry[]>(
    queryKeys.trainings.history(trainingId),
    `/trainings/${trainingId}/history`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) {
    return (
      <Skeleton
        rows={5}
        wrapperClassName="space-y-2"
        itemClassName="skeleton-shimmer h-14 rounded-card"
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem histórico"
        description="Acções sobre esta formação (criação, alterações, sessões, inscrições, presenças, avaliações, conclusão) aparecem aqui."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {data.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
        >
          <Avatar
            name={entry.user?.fullName ?? 'Sistema'}
            url={entry.user?.avatarUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="font-body text-sm text-ink">
              {ACTION_LABEL[entry.action] ?? entry.action}
            </div>
            <div className="font-body text-xs text-ink-faint">
              {entry.user?.fullName ?? 'Sistema'} ·{' '}
              {formatDateTime(entry.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}
