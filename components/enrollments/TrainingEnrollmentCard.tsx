// components/enrollments/TrainingEnrollmentCard.tsx
// Cartão de inscrição em formação (Training/TrainingParticipant) na vista
// "As minhas matrículas" — companion de EnrollmentCard.tsx (que cobre
// Enrollment/curso). Training não tem módulos/lições (ver schema.prisma),
// por isso não há "% concluído"/"aula X de Y" aqui: "continuar" significa
// abrir o detalhe da formação (próxima sessão, link de reunião, avaliação),
// não retomar uma aula — ver DetailView.tsx.

'use client';

import Image from 'next/image';
import { Award, CheckCircle2, GraduationCap } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_CFG, TYPE_CFG } from '@/components/trainings/constants';
import { fmtDate, fmtHours } from '@/components/trainings/utils';
import type { MyTrainingEntry, TrainingType } from '@/components/trainings/types';

interface TrainingEnrollmentCardProps {
  entry: MyTrainingEntry;
}

export function TrainingEnrollmentCard({ entry }: TrainingEnrollmentCardProps) {
  const training = entry.session?.training;
  if (!training) return null;

  const { status } = entry;
  const borderCls =
    status === 'COMPLETED'
      ? 'border-success'
      : status === 'ATTENDED'
        ? 'border-info'
        : 'border-border';

  return (
    <div
      className={`overflow-hidden rounded-card border bg-surface transition-all ${borderCls}`}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-control bg-surface-sunken">
          {training.thumbnailUrl ? (
            <Image
              src={training.thumbnailUrl}
              alt={training.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-faint">
              <GraduationCap size={22} strokeWidth={1.75} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-xs text-ink-faint">
                  Formação · {TYPE_CFG[training.type as TrainingType]?.label}
                </span>
              </div>
              <div className="line-clamp-1 text-sm font-medium text-ink">
                {training.title}
              </div>
            </div>
            <StatusBadge value={status} map={PARTICIPANT_CFG} variant="dot" />
          </div>

          <div className="mb-2 flex items-center gap-3 text-xs text-ink-faint">
            <span>{fmtHours(training.workloadHours)}</span>
            {entry.session?.sessionDate && (
              <span>{fmtDate(entry.session.sessionDate)}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {entry.finalScore !== null && (
                <span className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-success-subtle text-success-ink">
                  <Award size={14} strokeWidth={1.75} />
                  {entry.finalScore}%
                </span>
              )}
            </div>

            {/* CTA */}
            <div>
              {(status === 'REGISTERED' || status === 'WAITLIST') && (
                <a
                  href={`/trainings/${training.id}`}
                  className={buttonVariants({ intent: 'primary', size: 'sm' })}
                >
                  Ver inscrição →
                </a>
              )}
              {status === 'ATTENDED' && (
                <a
                  href={`/trainings/${training.id}`}
                  className={buttonVariants({ intent: 'primary', size: 'sm' })}
                >
                  Continuar →
                </a>
              )}
              {status === 'COMPLETED' && (
                <span className="flex items-center gap-1 text-xs font-medium text-success-ink">
                  <CheckCircle2 size={14} strokeWidth={1.75} />
                  Concluído
                </span>
              )}
              {(status === 'ABSENT' || status === 'CANCELLED') && (
                <a
                  href={`/trainings/${training.id}`}
                  className={buttonVariants({ intent: 'secondary', size: 'sm' })}
                >
                  Ver detalhes →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
