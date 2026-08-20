// components/ai-tutor/MessageBubble.tsx
// Bolha de mensagem do chat, com formatação markdown simples e
// rating para respostas do tutor. Extraído de
// app/(platform)/ai-tutor/page.tsx.

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDateTime as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import type { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  onRate: (id: number, r: number) => void;
}

export function MessageBubble({ msg, onRate }: MessageBubbleProps) {
  const isUser = msg.role === 'USER';
  const [hover, setHover] = useState(false);

  // Formatar markdown simples
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const bubbleContent = (
    <span
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(formatContent(msg.content)),
      }}
    />
  );

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <Avatar name="Íris" size="sm" className="mr-2 mt-1 flex-shrink-0" />
      )}
      <div
        className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {isUser ? (
          <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="rounded-card bg-primary px-4 py-3 font-body text-sm leading-relaxed text-canvas"
          >
            {bubbleContent}
          </div>
        ) : (
          <Card
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="px-4 py-3 font-body text-sm leading-relaxed text-ink"
          >
            {bubbleContent}
          </Card>
        )}

        <div
          className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span className="font-body text-xs text-ink-faint">
            {fmtDate(msg.createdAt)}
          </span>
          {msg.latencyMs && (
            <span className="font-body text-xs text-ink-faint">
              {msg.latencyMs}ms
            </span>
          )}

          {/* Rating para mensagens do tutor */}
          {!isUser && hover && !msg.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => onRate(msg.id, r)}
                  className="text-ink-faint hover:text-warning-ink"
                >
                  <Star size={14} strokeWidth={1.75} />
                </button>
              ))}
            </div>
          )}
          {!isUser && msg.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <Star
                  key={r}
                  size={14}
                  strokeWidth={1.75}
                  className={
                    r <= msg.rating!
                      ? 'fill-current text-warning-ink'
                      : 'text-ink-faint'
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
