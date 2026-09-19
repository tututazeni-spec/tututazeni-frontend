// components/ai-tutor/LessonTutorModal.tsx
// Secção 10 (docs/ai-tutor.md) — "O AI Tutor não deve existir apenas como
// módulo isolado no menu, deve aparecer dentro dos próprios módulos."
// Chat compacto embutido na sala de aula, contextualizado com o curso e a
// lição actual (startSession já usa lessonId para ir buscar o conteúdo da
// lição — ver ai-tutor.service.ts).

'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { MessageBubble } from './MessageBubble';
import type { Message, SendMessageResponse, StartSessionResponse } from './types';

interface LessonTutorModalProps {
  courseId: number;
  lessonId: number;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LessonTutorModal({
  courseId,
  lessonId,
  lessonTitle,
  open,
  onOpenChange,
}: LessonTutorModalProps) {
  const notify = useToast();
  const [session, setSession] = useState<{ id: number } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { mutate: startSession, isPending: starting } = useApiMutation(
    () =>
      apiClient.post<StartSessionResponse>('/ai-tutor/sessions', { courseId, lessonId }),
    {
      onSuccess: (res) => {
        setSession({ id: res.session.id });
        setMessages([
          {
            id: 0,
            role: 'ASSISTANT',
            content: res.greeting,
            createdAt: new Date().toISOString(),
            latencyMs: null,
            rating: null,
            provider: res.provider?.provider ?? null,
            agentAction: null,
          },
        ]);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  useEffect(() => {
    if (open && !session && !starting) {
      startSession(undefined);
    }
    if (!open) {
      setSession(null);
      setMessages([]);
      setInput('');
    }
  }, [open, lessonId, session, starting, startSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleRate = async (msgId: number, rating: number) => {
    try {
      await apiClient.patch('/ai-tutor/messages/rate', { messageId: msgId, rating });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, rating } : m)));
    } catch (e) {
      reportError(e, { source: 'LessonTutorModal.handleRate' });
    }
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || !session || thinking) return;
    setInput('');
    setMessages((prev) => [
      ...prev,
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
    setThinking(true);
    try {
      const res = await apiClient.post<SendMessageResponse>('/ai-tutor/sessions/message', {
        sessionId: session.id,
        message: msg,
        contextHint: `Colaborador está na lição "${lessonTitle}"`,
      });
      setMessages((prev) => [
        ...prev,
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
      reportError(e, { source: 'LessonTutorModal.send' });
      notify({ title: e instanceof Error ? e.message : 'Erro ao enviar mensagem', intent: 'danger' });
    } finally {
      setThinking(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title="Perguntar à Ísis" description={lessonTitle} className="max-w-lg">
        <div className="max-h-[50vh] min-h-[200px] overflow-y-auto space-y-1 my-4 pr-1">
          {starting && !session && (
            <div className="flex items-center gap-2 text-ink-faint font-body text-sm">
              <Avatar name="Ísis" size="sm" />A carregar contexto da lição…
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onRate={handleRate} />
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ex: dá-me um exemplo prático desta lição…"
            disabled={!session || thinking}
            className="flex-1"
          />
          <IconButton
            icon={Send}
            label="Enviar"
            onClick={send}
            disabled={!session || !input.trim() || thinking}
          />
        </div>
      </ModalContent>
    </Modal>
  );
}
