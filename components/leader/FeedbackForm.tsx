// components/leader/FeedbackForm.tsx
// Formulário de feedback (usado no modal da tab Equipa). Extraído
// de app/(platform)/leader/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';

interface FeedbackFormProps {
  recipientId: number;
  onClose: () => void;
}

export function FeedbackForm({ recipientId, onClose }: FeedbackFormProps) {
  const [type, setType] = useState('POSITIVE');
  const [content, setContent] = useState('');

  const sendFeedback = useApiMutation(
    () => apiClient.post('/leaders/feedback', { recipientId, type, content }),
    { onSettled: onClose },
  );
  const sending = sendFeedback.isPending;
  const send = () => {
    if (content.trim()) sendFeedback.mutate(undefined);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {['POSITIVE', 'CONSTRUCTIVE', 'SBI'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`text-xs px-3 py-1.5 rounded-lg ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escreve o teu feedback..."
        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none h-28 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={send}
          disabled={sending || !content.trim()}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {sending ? 'A enviar…' : 'Enviar Feedback'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
