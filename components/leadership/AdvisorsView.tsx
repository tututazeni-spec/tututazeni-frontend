// components/leadership/AdvisorsView.tsx
// Separador "Mentores & Coaches": equipa de acompanhamento do programa
// (só leitura, gerida no assistente) + atribuição de mentor/coach a cada
// participante (PUT .../participants/:userId/advisors).

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ADVISOR_ROLE_ITEMS } from './constants';
import type { LeadershipProgramDetail } from './types';

export interface AdvisorsViewProps {
  programId: number;
  detail: LeadershipProgramDetail;
  canManage: boolean;
}

const roleLabel = (r: string) => ADVISOR_ROLE_ITEMS.find((x) => x.value === r)?.label ?? r;

export function AdvisorsView({ programId, detail, canManage }: AdvisorsViewProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-body text-sm font-semibold text-ink">Equipa do programa</h3>
        {detail.advisors.length === 0 ? (
          <EmptyState title="Sem equipa" description="Adicione mentores, coaches e formadores no assistente do programa." />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {detail.advisors.map((a) => (
              <Card key={a.id} className="p-3">
                <div className="font-body text-sm text-ink">{a.user.fullName}</div>
                <div className="font-body text-xs text-ink-faint">{roleLabel(a.role)}</div>
                {a.focusArea && (
                  <div className="mt-1 font-body text-xs text-ink-muted">{a.focusArea}</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <section>
          <h3 className="mb-2 font-body text-sm font-semibold text-ink">
            Mentor / coach por participante
          </h3>
          <div className="space-y-2">
            {detail.participants.map((p) => (
              <AdvisorRow
                key={p.userId}
                programId={programId}
                userId={p.userId}
                name={p.user.fullName}
                mentorId={p.mentorId}
                coachId={p.coachId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AdvisorRow({
  programId,
  userId,
  name,
  mentorId,
  coachId,
}: {
  programId: number;
  userId: number;
  name: string;
  mentorId: number | null;
  coachId: number | null;
}) {
  const notify = useToast();
  const [mentor, setMentor] = useState('');
  const [coach, setCoach] = useState('');

  const save = useApiMutation(
    () =>
      apiClient.put(`/leadership/programs/${programId}/participants/${userId}/advisors`, {
        mentorId: mentor ? Number(mentor) : undefined,
        coachId: coach ? Number(coach) : undefined,
      }),
    {
      invalidateKeys: [queryKeys.leadership.programDetail(programId)],
      onSuccess: () => notify({ title: 'Atualizado', intent: 'success' }),
      onError: (e) => {
        reportError(e, { source: 'AdvisorsView.save' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  return (
    <div className="flex items-center gap-2 rounded-card border border-border px-3 py-2">
      <span className="w-48 truncate font-body text-sm text-ink">{name}</span>
      <Input
        type="number"
        className="w-32"
        placeholder={mentorId ? `Mentor #${mentorId}` : 'Mentor (User ID)'}
        value={mentor}
        onChange={(e) => setMentor(e.target.value)}
      />
      <Input
        type="number"
        className="w-32"
        placeholder={coachId ? `Coach #${coachId}` : 'Coach (User ID)'}
        value={coach}
        onChange={(e) => setCoach(e.target.value)}
      />
      <Button size="sm" onClick={() => save.mutate(undefined)} loading={save.isPending}>
        Guardar
      </Button>
    </div>
  );
}
