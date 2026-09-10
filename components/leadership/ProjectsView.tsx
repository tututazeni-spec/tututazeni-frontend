// components/leadership/ProjectsView.tsx
// Separador "Projetos de Liderança": lista os projectos do programa (do
// detalhe) e permite criar/avaliar (POST .../projects,
// PATCH /leadership/projects/:id/evaluation).

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
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PROJECT_STATUS_CFG } from './constants';
import type { LeadershipProgramDetail } from './types';

export interface ProjectsViewProps {
  programId: number;
  detail: LeadershipProgramDetail;
  canManage: boolean;
}

export function ProjectsView({ programId, detail, canManage }: ProjectsViewProps) {
  const notify = useToast();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [participantUserId, setParticipantUserId] = useState('');
  const invalidate = [queryKeys.leadership.programDetail(programId)];

  const create = useApiMutation(
    () =>
      apiClient.post(`/leadership/programs/${programId}/projects`, {
        title: title.trim(),
        participantUserId: participantUserId ? Number(participantUserId) : undefined,
      }),
    {
      invalidateKeys: invalidate,
      onSuccess: () => {
        notify({ title: 'Projeto criado', intent: 'success' });
        setCreating(false);
        setTitle('');
        setParticipantUserId('');
      },
      onError: (e) => {
        reportError(e, { source: 'ProjectsView.create' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  const participantItems = detail.participants.map((p) => ({
    value: String(p.userId),
    label: p.user.fullName,
  }));

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {creating ? (
            <div className="flex items-end gap-2 rounded-card border border-border p-3">
              <FormField label="Título *" htmlFor="proj-title">
                <Input
                  id="proj-title"
                  className="w-64"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <FormField label="Participante" htmlFor="proj-part">
                <Select
                  items={participantItems}
                  value={participantUserId || undefined}
                  onValueChange={setParticipantUserId}
                  className="w-48"
                  placeholder="Sem participante"
                />
              </FormField>
              <Button
                size="sm"
                onClick={() => create.mutate(undefined)}
                loading={create.isPending}
                disabled={!title.trim()}
              >
                Criar
              </Button>
              <Button size="sm" intent="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setCreating(true)}>
              Novo projeto
            </Button>
          )}
        </div>
      )}

      {detail.projects.length === 0 ? (
        <EmptyState title="Sem projetos" description="Nenhum projeto de liderança registado." />
      ) : (
        <div className="space-y-2">
          {detail.projects.map((proj) => (
            <ProjectCard
              key={proj.id}
              programId={programId}
              project={proj}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  programId,
  project,
  canManage,
}: {
  programId: number;
  project: LeadershipProgramDetail['projects'][number];
  canManage: boolean;
}) {
  const notify = useToast();
  const [score, setScore] = useState('');
  const evaluate = useApiMutation(
    () =>
      apiClient.patch(`/leadership/projects/${project.id}/evaluation`, {
        score: score ? Number(score) : undefined,
      }),
    {
      invalidateKeys: [queryKeys.leadership.programDetail(programId)],
      onSuccess: () => notify({ title: 'Projeto avaliado', intent: 'success' }),
      onError: (e) => {
        reportError(e, { source: 'ProjectsView.evaluate' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-body text-sm font-medium text-ink">{project.title}</div>
          {project.kpiName && (
            <div className="font-body text-xs text-ink-faint">
              KPI: {project.kpiName} {project.kpiTarget ? `→ ${project.kpiTarget}` : ''}
            </div>
          )}
        </div>
        <StatusBadge value={project.status} map={PROJECT_STATUS_CFG} />
      </div>
      {canManage && project.status !== 'COMPLETED' && project.status !== 'REJECTED' && (
        <div className="mt-2 flex items-end gap-2">
          <Input
            type="number"
            className="w-24"
            placeholder="Nota"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
          <Button size="sm" onClick={() => evaluate.mutate(undefined)} loading={evaluate.isPending}>
            Avaliar
          </Button>
        </div>
      )}
      {project.score != null && (
        <div className="mt-1 font-body text-xs text-ink-muted">Nota: {project.score}</div>
      )}
    </Card>
  );
}
