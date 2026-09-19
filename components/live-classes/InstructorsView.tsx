// components/live-classes/InstructorsView.tsx
// Separador "Formadores" (docs/aulas-ao-vivo.md secção 7) — lista os
// TrainingInstructorProfile que têm pelo menos uma aula ao vivo atribuída
// (instructorId/coInstructorId), com estatísticas calculadas a partir das
// LiveClass/LiveClassSession/PostClassEvaluation (nunca guardadas — mesmo
// padrão de trainers.service.ts#findOne). Leitura apenas: a gestão do
// registo (criar/editar/eliminar formador) continua em Trainings → Formadores
// (docs/aulas-ao-vivo.md secção 7 — "Liga aos formadores no módulo
// Trainings").

'use client';

import { useState } from 'react';
import { Award, BookOpen, Clock, Star, Users as UsersIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LiveInstructor } from './types';

export function InstructorsView() {
  const [viewing, setViewing] = useState<LiveInstructor | null>(null);

  const { data, isLoading } = useApiQuery<LiveInstructor[]>(
    queryKeys.liveClasses.instructors(),
    '/live-classes/instructors',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const instructors = data ?? [];

  if (isLoading) return <Skeleton rows={4} />;

  if (instructors.length === 0) {
    return (
      <EmptyState
        title="Sem formadores com aulas ao vivo"
        description="Atribui um formador a uma aula (Etapa 1 do assistente) para o ver aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="divide-y divide-border">
        {instructors.map((t) => (
          <button
            key={t.id}
            onClick={() => setViewing(t)}
            className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunken"
          >
            <Avatar name={t.name} url={t.user?.avatarUrl ?? undefined} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{t.name}</div>
              <div className="text-xs text-ink-faint">
                {t.specialties.length > 0 ? t.specialties.join(', ') : t.entity ?? '—'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-body text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={12} strokeWidth={1.75} /> {t.liveClassStats.completed} realizadas
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} strokeWidth={1.75} /> {t.liveClassStats.hoursMinistered}h
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersIcon size={12} strokeWidth={1.75} /> {t.liveClassStats.participants}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star size={12} strokeWidth={1.75} /> {t.liveClassStats.avgRating || '—'}
              </span>
            </div>
          </button>
        ))}
      </Card>

      {viewing && (
        <Modal open onOpenChange={(open) => !open && setViewing(null)}>
          <ModalContent title={viewing.name}>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={viewing.name} url={viewing.user?.avatarUrl ?? undefined} size="md" />
                <div>
                  <div className="text-sm font-medium text-ink">{viewing.name}</div>
                  <div className="text-xs text-ink-faint">{viewing.email ?? '—'}{viewing.phone ? ` · ${viewing.phone}` : ''}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Award, label: 'Aulas agendadas', value: viewing.liveClassStats.scheduled },
                  { icon: BookOpen, label: 'Aulas realizadas', value: viewing.liveClassStats.completed },
                  { icon: Clock, label: 'Horas ministradas', value: `${viewing.liveClassStats.hoursMinistered}h` },
                  { icon: UsersIcon, label: 'Participantes', value: viewing.liveClassStats.participants },
                ].map((f) => (
                  <div key={f.label} className="rounded-control border border-border p-3">
                    <div className="flex items-center gap-1.5 font-body text-xs text-ink-faint">
                      <f.icon size={12} strokeWidth={1.75} /> {f.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-ink">{f.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-control border border-border p-3">
                <div className="flex items-center gap-1.5 font-body text-xs text-ink-faint">
                  <Star size={12} strokeWidth={1.75} /> Avaliação média
                </div>
                <div className="mt-1 text-lg font-semibold text-ink">
                  {viewing.liveClassStats.avgRating ? `${viewing.liveClassStats.avgRating}/5` : 'Sem avaliações'}
                </div>
              </div>

              {viewing.liveClassStats.courses.length > 0 && (
                <div>
                  <div className="mb-1 font-body text-xs font-medium text-ink-faint">Cursos</div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewing.liveClassStats.courses.map((c) => (
                      <span key={c} className="rounded bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewing.certifications && (
                <div>
                  <div className="mb-1 font-body text-xs font-medium text-ink-faint">Certificações</div>
                  <p className="font-body text-sm text-ink-muted">{viewing.certifications}</p>
                </div>
              )}
              {viewing.professionalExperience && (
                <div>
                  <div className="mb-1 font-body text-xs font-medium text-ink-faint">Experiência profissional</div>
                  <p className="font-body text-sm text-ink-muted">{viewing.professionalExperience}</p>
                </div>
              )}
              {viewing.availability && (
                <div>
                  <div className="mb-1 font-body text-xs font-medium text-ink-faint">Disponibilidade</div>
                  <p className="font-body text-sm text-ink-muted">{viewing.availability}</p>
                </div>
              )}

              <p className="font-body text-xs text-ink-faint">
                Para editar este registo, usa o módulo Trainings → Formadores.
              </p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
