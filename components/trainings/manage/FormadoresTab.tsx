// components/trainings/manage/FormadoresTab.tsx
// Separador "Formadores" (docs/trainings-detalhado.md pt.11 — formador
// principal, formadores adicionais, sessões atribuídas, horas). O schema
// não tem um TrainingSession.instructorId (a sessão herda sempre o(s)
// formador(es) da Training — ver comentário em Training.classDescription),
// por isso "sessões atribuídas/horas" é o total da formação, igual para o
// principal e para os adicionais, não uma repartição por pessoa.

'use client';

import { CalendarClock, Clock, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { RowCard } from './RowCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtHours } from '../utils';
import type { Training } from '../types';

interface FormadoresTabProps {
  training: Training;
}

function scheduledHours(training: Training): number {
  const sessions = training.sessions ?? [];
  if (sessions.length === 0) return training.workloadHours ?? 0;
  return (
    Math.round(
      (sessions.reduce((s, sess) => s + sess.durationMinutes, 0) / 60) * 10,
    ) / 10
  );
}

export function FormadoresTab({ training }: FormadoresTabProps) {
  const hours = scheduledHours(training);
  const sessionsCount = training._count.sessions;
  const principal = training.instructor
    ? {
        name: training.instructor.fullName,
        avatarUrl: training.instructor.avatarUrl,
        sub: 'Interno',
      }
    : training.externalInstructor
      ? {
          name: training.externalInstructor.name,
          avatarUrl: null,
          sub: training.externalInstructor.entity ?? 'Externo',
        }
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 font-display text-xl font-extrabold text-[#0F1F3D]">
          Formador principal
        </h3>
        {principal ? (
          <RowCard
            leading={
              <Avatar
                name={principal.name}
                url={principal.avatarUrl ?? undefined}
                size="lg"
                className="!h-14 !w-14 shrink-0"
              />
            }
            title={principal.name}
            badges={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1F3D] px-3 py-1 text-sm font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-white" />
                {principal.sub}
              </span>
            }
            meta={[
              { icon: CalendarClock, value: sessionsCount, label: 'sessões' },
              { icon: Clock, value: fmtHours(hours), label: 'horas' },
            ]}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Sem formador principal atribuído"
            description="Atribua um formador interno ou externo na edição da formação."
          />
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-xl font-extrabold text-[#0F1F3D]">
          Formadores adicionais
        </h3>
        {(training.coInstructors ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem formadores adicionais"
            description="Formadores de apoio associados a esta formação aparecem aqui."
          />
        ) : (
          <div className="space-y-3">
            {(training.coInstructors ?? []).map((c) => (
              <RowCard
                key={c.id}
                leading={
                  <Avatar
                    name={c.user.fullName}
                    url={c.user.avatarUrl ?? undefined}
                    size="lg"
                    className="!h-14 !w-14 shrink-0"
                  />
                }
                title={c.user.fullName}
                badges={
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3E9F5] px-3 py-1 text-sm font-semibold text-[#0F1F3D]">
                    <span className="h-2 w-2 rounded-full bg-[#7A869E]" />
                    Apoio
                  </span>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
