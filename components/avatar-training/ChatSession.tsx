// components/avatar-training/ChatSession.tsx
// Overlay de conversa com o avatar (envio de mensagens, score em tempo
// real, conclusão da sessão). Extraído de
// app/(platform)/avatar-training/page.tsx.
//
// Backdrop+painel bespoke passam a Modal/ModalContent (Radix Dialog,
// components/ui/Modal) — mesmo padrão de
// components/documents/UploadModal.tsx / components/work-declaration/CreateModal.tsx.
// O slot `title` do ModalContent só aceita texto, por isso o avatar
// (imagem/ícone) sai da linha do cabeçalho e fica só nas bolhas de
// mensagem — simplificação visual, sem alteração de dados/comportamento.

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Bot, CheckCircle, Send } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { SCORE_COLOR } from './constants';
import type {
  ActiveSession,
  MessageResponse,
  SessionMessage,
  SessionResult,
} from './types';

export interface ChatSessionProps {
  session: ActiveSession;
  onComplete: (result: SessionResult) => void;
  onClose: () => void;
}

export function ChatSession({
  session,
  onComplete,
  onClose,
}: ChatSessionProps) {
  const [messages, setMessages] = useState<SessionMessage[]>(
    session.conversationHistory ?? [],
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [runningScore, setRunningScore] = useState<number | null>(null);
  const [isLastTurn, setIsLastTurn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg: SessionMessage = {
      role: 'USER',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const r = await apiClient.post<MessageResponse>(
        `/avatar-training/sessions/${session.id}/message`,
        {
          message: input,
          turnIndex: messages.filter((m) => m.role === 'USER').length,
        },
      );

      const avatarMsg: SessionMessage = {
        role: 'AVATAR',
        content: r.avatarResponse,
        timestamp: new Date().toISOString(),
        score: r.turnScore,
        behavioral: r.behavioral,
      };
      setMessages((prev) => [...prev, avatarMsg]);
      setRunningScore(r.runningScore);
      setIsLastTurn(r.isLastTurn);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'SYSTEM',
          content: '⚠️ Erro na comunicação',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const completeMutation = useApiMutation(
    () =>
      apiClient.post<SessionResult>(
        `/avatar-training/sessions/${session.id}/complete`,
        { score: runningScore ?? undefined },
      ),
    { onSuccess: (r) => onComplete(r) },
  );
  const completing = completeMutation.isPending;
  const complete = () => completeMutation.mutate(undefined);

  const avatarName = session.avatar?.name ?? 'Avatar';
  const avatarImage = session.avatar?.avatarImageUrl;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={avatarName}
        description={session.scenario.title}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col"
      >
        {runningScore !== null && (
          <div className="absolute right-14 top-5 rounded-control bg-primary-subtle px-3 py-1 text-center">
            <p className={`text-lg font-bold ${SCORE_COLOR(runningScore)}`}>
              {runningScore}
            </p>
            <p className="text-[9px] text-ink-faint">Score</p>
          </div>
        )}

        {/* Objective */}
        {session.scenario.objective && (
          <div className="-mx-6 mt-4 bg-primary-subtle border-y border-primary-subtle px-6 py-2">
            <p className="text-xs text-primary">
              🎯 <span className="font-medium">Objectivo:</span>{' '}
              {session.scenario.objective}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="-mx-6 mt-2 flex-1 space-y-3 overflow-y-auto px-6 py-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {m.role === 'AVATAR' && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 overflow-hidden relative">
                  {avatarImage ? (
                    <Image
                      src={avatarImage}
                      alt={avatarName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Bot size={14} strokeWidth={1.75} className="text-canvas" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[80%] ${m.role === 'SYSTEM' ? 'mx-auto' : ''}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'USER'
                      ? 'bg-primary text-canvas rounded-br-sm'
                      : m.role === 'SYSTEM'
                        ? 'bg-surface-sunken text-ink-muted text-xs text-center'
                        : 'bg-surface-sunken text-ink rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'AVATAR' && m.score !== undefined && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span
                      className={`text-[10px] font-bold ${SCORE_COLOR(m.score)}`}
                    >
                      Score: {m.score}
                    </span>
                    {m.behavioral && (
                      <div className="flex gap-1">
                        {Object.entries(m.behavioral)
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <span key={k} className="text-[9px] text-ink-faint">
                              {k.slice(0, 3)}: {v}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Bot size={14} strokeWidth={1.75} className="text-canvas" />
              </div>
              <div className="bg-surface-sunken rounded-2xl rounded-bl-sm px-4 py-2.5">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="-mx-6 -mb-6 border-t border-border p-4">
          {isLastTurn ? (
            <Button
              intent="success"
              onClick={complete}
              disabled={completing}
              className="w-full"
            >
              <CheckCircle size={16} strokeWidth={1.75} />
              {completing ? 'A concluir…' : 'Concluir Sessão e Ver Resultados'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Escreve a tua resposta..."
                className="flex-1"
              />
              <IconButton
                icon={Send}
                label="Enviar"
                onClick={send}
                disabled={sending || !input.trim()}
              />
              <Button
                intent="secondary"
                size="sm"
                onClick={complete}
                disabled={completing}
              >
                Concluir
              </Button>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
