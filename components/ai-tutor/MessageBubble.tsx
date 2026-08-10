// components/ai-tutor/MessageBubble.tsx
// Bolha de mensagem do chat, com formatação markdown simples e
// rating para respostas do tutor. Extraído de
// app/(platform)/ai-tutor/page.tsx.

'use client';

import { useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDateTime as fmtDate } from '@/lib/format';
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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0 mt-1">
          N
        </div>
      )}
      <div
        className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
      >
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-700 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
          }`}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(formatContent(msg.content)),
            }}
          />
        </div>

        <div
          className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span className="text-xs text-gray-400">
            {fmtDate(msg.createdAt)}
          </span>
          {msg.latencyMs && (
            <span className="text-xs text-gray-300">{msg.latencyMs}ms</span>
          )}

          {/* Rating para mensagens do tutor */}
          {!isUser && hover && !msg.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => onRate(msg.id, r)}
                  className="text-gray-300 hover:text-amber-400 text-xs"
                >
                  ★
                </button>
              ))}
            </div>
          )}
          {!isUser && msg.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <span
                  key={r}
                  className={`text-xs ${r <= msg.rating! ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
