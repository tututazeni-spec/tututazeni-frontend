// components/enrollments/AdminTrainingTable.tsx
// Passo 2 da "Gestão (Admin)" para uma FORMAÇÃO — lista de matriculados
// (TrainingParticipant) da formação seleccionada no passo 1 (AdminPicker).
// Sem progresso por lição/deadline (Training não tem módulos — ver
// components/enrollments/TrainingEnrollmentCard.tsx); mostra sessão, estado
// e nota final. Escopo por papel aplicado no backend — ver
// TrainingService.getParticipants.

'use client';

import { ArrowLeft } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_CFG } from '@/components/trainings/constants';
import { fmtDate } from '@/components/trainings/utils';
import type { TrainingParticipantsResponse } from './types';

interface AdminTrainingTableProps {
  trainingId: number;
  title: string;
  onBack: () => void;
}

export function AdminTrainingTable({
  trainingId,
  title,
  onBack,
}: AdminTrainingTableProps) {
  const { data, isLoading: loading } = useApiQuery<TrainingParticipantsResponse>(
    queryKeys.trainings.participants(trainingId),
    `/trainings/${trainingId}/participants`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar à selecção
      </Button>
      <h2 className="mb-4 font-display text-base font-semibold text-ink">
        {title}
      </h2>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-[1fr_160px_140px_100px] gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <div>Colaborador</div>
          <div>Sessão</div>
          <div>Estado</div>
          <div>Nota</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton
              rows={4}
              wrapperClassName="space-y-2 animate-pulse"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          </div>
        )}

        {!loading && data?.participants.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-ink-faint">
            Sem matriculados nesta formação
          </div>
        )}

        {!loading &&
          data?.participants.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_160px_140px_100px] items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
            >
              <div className="flex items-center gap-2">
                <Avatar
                  name={p.user.fullName}
                  url={p.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <div>
                  <div className="text-xs font-medium text-ink">
                    {p.user.fullName}
                  </div>
                  <div className="text-xs text-ink-faint">
                    {p.user.email}
                    {p.user.department?.name && ` · ${p.user.department.name}`}
                  </div>
                </div>
              </div>
              <div className="text-xs text-ink-faint">
                {fmtDate(p.session.sessionDate)}
              </div>
              <div>
                <StatusBadge value={p.status} map={PARTICIPANT_CFG} variant="dot" />
              </div>
              <div className="text-xs text-ink-muted">
                {p.finalScore !== null ? `${p.finalScore}%` : '—'}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
