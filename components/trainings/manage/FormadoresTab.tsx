// components/trainings/manage/FormadoresTab.tsx
// Separador "Formadores" (docs/trainings-detalhado.md pt.11 — formador
// principal, formadores adicionais, sessões atribuídas, horas). O schema
// não tem um TrainingSession.instructorId (a sessão herda sempre o(s)
// formador(es) da Training — ver comentário em Training.classDescription),
// por isso "sessões atribuídas/horas" é o total da formação, igual para o
// principal e para os adicionais, não uma repartição por pessoa.

'use client';

import { Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
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
        <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Formador principal
        </h3>
        {principal ? (
          <Card className="flex items-center gap-3 p-4">
            <Avatar
              name={principal.name}
              url={principal.avatarUrl ?? undefined}
              size="md"
            />
            <div className="flex-1">
              <div className="font-body text-sm font-medium text-ink">
                {principal.name}
              </div>
              <div className="font-body text-xs text-ink-faint">
                {principal.sub}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-ink">
                {sessionsCount}
              </div>
              <div className="font-body text-xs text-ink-faint">sessões</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-ink">
                {fmtHours(hours)}
              </div>
              <div className="font-body text-xs text-ink-faint">horas</div>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={Users}
            title="Sem formador principal atribuído"
            description="Atribua um formador interno ou externo na edição da formação."
          />
        )}
      </div>

      <div>
        <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Formadores adicionais
        </h3>
        {(training.coInstructors ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem formadores adicionais"
            description="Formadores de apoio associados a esta formação aparecem aqui."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            {(training.coInstructors ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <Avatar
                  name={c.user.fullName}
                  url={c.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="flex-1 font-body text-sm text-ink">
                  {c.user.fullName}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
