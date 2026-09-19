// components/ai-tutor/SessionThread.tsx
// Detalhe de uma sessão existente: histórico de mensagens + (se a sessão
// ainda estiver activa) caixa para continuar a conversa. Usado pela aba
// Sessões para "Ver conversa" / "Continuar sessão" (docs/ai-tutor.md secção 4).

'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageBubble } from './MessageBubble';
import type { Message, SendMessageResponse, SessionDetail } from './types';

interface SessionThreadProps {
  sessionId: number;
  onBack: () => void;
}

export function SessionThread({ sessionId, onBack }: SessionThreadProps) {
  const notify = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useApiQuery<
    SessionDetail & { endedAt: string | null; course?: { title: string } | null }
  >(queryKeys.aiTutor.session(sessionId), `/ai-tutor/sessions/${sessionId}`);

  useEffect(() => {
    if (data) setMessages(data.messages);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRate = async (msgId: number, rating: number) => {
    try {
      await apiClient.patch('/ai-tutor/messages/rate', { messageId: msgId, rating });
      setMessages((prev) => prev?.map((m) => (m.id === msgId ? { ...m, rating } : m)) ?? null);
    } catch (e) {
      reportError(e, { source: 'SessionThread.handleRate' });
      notify({ title: 'Não foi possível avaliar a mensagem', intent: 'danger' });
    }
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput('');
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: Date.now(),
        role: 'USER',
        content: msg,
        createdAt: new Date().toISOString(),
        latencyMs: null,
        rating: null,
        provider: null,
        agentAction: null,
      },
    ]);
    setSending(true);
    try {
      const res = await apiClient.post<SendMessageResponse>('/ai-tutor/sessions/message', {
        sessionId,
        message: msg,
      });
      setMessages((prev) => [
        ...(prev ?? []),
        {
          id: res.message.id,
          role: 'ASSISTANT',
          content: res.message.content,
          createdAt: res.message.createdAt,
          latencyMs: res.latencyMs,
          rating: null,
          provider: res.provider,
          agentAction: res.message.agentAction,
          sourceLabels: res.sources?.map((s) => s.label),
        },
      ]);
    } catch (e) {
      reportError(e, { source: 'SessionThread.send' });
      const errMsg = e instanceof Error ? e.message : String(e);
      notify({ title: errMsg, intent: 'danger' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button intent="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar às sessões
        </Button>
        {data && (
          <Badge intent={data.endedAt ? 'neutral' : 'success'}>
            {data.endedAt ? 'Encerrada' : 'Activa'}
          </Badge>
        )}
      </div>

      {isLoading || !messages ? (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : (
        <Card className="p-4 space-y-1 max-h-[55vh] overflow-y-auto mb-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onRate={handleRate} />
          ))}
          <div ref={bottomRef} />
        </Card>
      )}

      {data && !data.endedAt && (
        <div className="flex gap-2">
          <Avatar name="Ísis" size="sm" className="flex-shrink-0 mt-1.5" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Continuar a conversa…"
            disabled={sending}
            className="flex-1"
          />
          <IconButton
            icon={Send}
            label="Enviar"
            onClick={send}
            disabled={!input.trim() || sending}
          />
        </div>
      )}
    </div>
  );
}
