// components/ai-tutor/SessionsView.tsx
// Vista "Sessões" (docs/ai-tutor.md secção 4). Colaboradores veem as suas
// próprias sessões; ADMIN/RH veem todas as sessões da plataforma, com a
// coluna "Colaborador". Acções: Continuar sessão, Ver conversa, Eliminar.

'use client';

import { useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SessionThread } from './SessionThread';
import type { AdminSessionRow, Session } from './types';

const PRIVILEGED_ROLES = new Set(['ADMIN', 'RH']);

export function SessionsView() {
  const notify = useToast();
  const confirm = useConfirm();
  const role = useCurrentRole();
  const isPrivileged = !!role && PRIVILEGED_ROLES.has(role);
  const [selected, setSelected] = useState<number | null>(null);

  const mine = useApiQuery<{ data: Session[] }>(
    queryKeys.aiTutor.sessions(),
    '/ai-tutor/sessions',
    { staleTime: STALE_TIME.DYNAMIC, enabled: !isPrivileged },
  );
  const all = useApiQuery<{ data: AdminSessionRow[] }>(
    queryKeys.aiTutor.allSessions(),
    '/ai-tutor/sessions/all',
    { staleTime: STALE_TIME.DYNAMIC, enabled: isPrivileged },
  );

  const loading = isPrivileged ? all.isLoading : mine.isLoading;

  const deleteMutation = useApiMutation(
    (id: number) => apiClient.delete(`/ai-tutor/sessions/${id}`),
    {
      invalidateKeys: [queryKeys.aiTutor.sessions(), queryKeys.aiTutor.allSessions()],
      onSuccess: () => notify({ title: 'Histórico eliminado', intent: 'success' }),
      onError: (e) => {
        reportError(e, { source: 'SessionsView.delete' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  const handleDelete = async (id: number) => {
    if (
      await confirm({
        title: 'Eliminar histórico desta sessão?',
        message: 'As mensagens desta sessão serão eliminadas permanentemente.',
        confirmLabel: 'Eliminar',
        destructive: true,
      })
    ) {
      deleteMutation.mutate(id);
      if (selected === id) setSelected(null);
    }
  };

  if (selected) return <SessionThread sessionId={selected} onBack={() => setSelected(null)} />;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  if (isPrivileged) {
    const rows = all.data?.data ?? [];
    return (
      <div className="space-y-2">
        {rows.map((s) => (
          <Card key={s.id} className="flex items-center gap-4 p-4">
            <Avatar name={s.user?.fullName ?? 'Ísis'} size="md" className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-medium text-ink truncate">
                {s.user?.fullName ?? 'Colaborador'}
                {s.course ? ` · ${s.course.title}` : ''}
              </div>
              <div className="font-body text-xs text-ink-faint">
                {fmtDate(s.startedAt)}
                {s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}
              </div>
            </div>
            <div className="font-body text-xs text-ink-faint flex-shrink-0 text-right hidden sm:block">
              {s.questions} perguntas
              <br />
              {s.contentsConsulted} conteúdos consultados
            </div>
            {s.avgRating != null && (
              <Badge intent="info" className="flex-shrink-0">
                {s.avgRating}/5
              </Badge>
            )}
            {s.endedAt ? (
              <Badge intent="neutral">Encerrada</Badge>
            ) : (
              <Badge intent="success">Activa</Badge>
            )}
            <Button size="sm" intent="secondary" onClick={() => setSelected(s.id)}>
              {s.endedAt ? 'Ver conversa' : 'Continuar'}
            </Button>
            <IconButton
              icon={Trash2}
              label="Eliminar histórico"
              intent="ghost"
              onClick={() => handleDelete(s.id)}
            />
          </Card>
        ))}
        {rows.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma sessão registada ainda"
            description="As sessões dos colaboradores com a Ísis vão aparecer aqui."
          />
        )}
      </div>
    );
  }

  const sessions = mine.data?.data ?? [];
  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <Card key={s.id} className="flex items-center gap-4 p-4">
          <Avatar name="Ísis" size="md" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-body text-sm font-medium text-ink truncate">
              Sessão #{s.id}
              {s.course ? ` · ${s.course.title}` : ''}
            </div>
            <div className="font-body text-xs text-ink-faint">{fmtDate(s.startedAt)}</div>
          </div>
          <div className="font-body text-xs text-ink-faint flex-shrink-0">
            {s._count?.messages ?? 0} mensagens
          </div>
          {s.endedAt ? (
            <Badge intent="neutral">Encerrada</Badge>
          ) : (
            <Badge intent="success">Activa</Badge>
          )}
          <Button size="sm" intent="secondary" onClick={() => setSelected(s.id)}>
            {s.endedAt ? 'Ver conversa' : 'Continuar'}
          </Button>
          <IconButton
            icon={Trash2}
            label="Eliminar histórico"
            intent="ghost"
            onClick={() => handleDelete(s.id)}
          />
        </Card>
      ))}
      {sessions.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma sessão iniciada ainda"
          description="Inicia uma conversa com a Ísis no separador Chat para veres o histórico aqui."
        />
      )}
    </div>
  );
}
