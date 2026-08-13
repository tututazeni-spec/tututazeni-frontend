// components/ai-tutor/HistoryView.tsx
// Vista "Histórico": lista de sessões + detalhe de mensagens de uma
// sessão seleccionada. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Message, Session, SessionDetail } from './types';

export function HistoryView() {
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ messages: Message[] } | null>(null);

  const { data: sessionsResp, isLoading: loading } = useApiQuery<{
    data: Session[];
  }>(queryKeys.aiTutor.sessions(), '/ai-tutor/sessions', {
    staleTime: STALE_TIME.DYNAMIC,
  });
  const sessions = sessionsResp?.data ?? [];

  const loadDetail = async (id: number) => {
    setSelected(id);
    const s = await apiClient.get<SessionDetail>(`/ai-tutor/sessions/${id}`);
    setDetail({ messages: s.messages });
  };

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  if (selected && detail) {
    return (
      <div>
        <Button
          intent="ghost"
          size="sm"
          onClick={() => {
            setSelected(null);
            setDetail(null);
          }}
          className="mb-4"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
        <Card className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {detail.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-card font-body text-sm ${
                  m.role === 'USER'
                    ? 'bg-primary text-canvas'
                    : 'bg-surface-sunken text-ink'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <Card
          key={s.id}
          interactive
          onClick={() => loadDetail(s.id)}
          className="flex items-center gap-4 p-4"
        >
          <Avatar name="NOVA" size="md" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-body text-sm font-medium text-ink">
              Sessão #{s.id}
              {s.course ? ` · ${s.course.title}` : ''}
            </div>
            <div className="font-body text-xs text-ink-faint">
              {fmtDate(s.startedAt)}
            </div>
          </div>
          <div className="font-body text-xs text-ink-faint flex-shrink-0">
            {s._count?.messages ?? 0} mensagens
          </div>
          {s.endedAt ? (
            <Badge intent="neutral">Encerrada</Badge>
          ) : (
            <Badge intent="success">Activa</Badge>
          )}
        </Card>
      ))}
      {sessions.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma sessão iniciada ainda"
          description="Inicia uma conversa com o NOVA no separador Chat para veres o histórico aqui."
        />
      )}
    </div>
  );
}
