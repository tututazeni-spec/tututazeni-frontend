// components/leader/FeedbackForm.tsx
// Formulário de feedback (usado no modal da tab Equipa). Extraído
// de app/(platform)/leader/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface FeedbackFormProps {
  recipientId: number;
  onClose: () => void;
}

const FEEDBACK_TYPES = ['POSITIVE', 'CONSTRUCTIVE', 'SBI'] as const;

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
        {FEEDBACK_TYPES.map((t) => (
          <Button
            key={t}
            size="sm"
            intent={type === t ? 'primary' : 'ghost'}
            onClick={() => setType(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escreve o teu feedback..."
        className="h-28 w-full resize-none"
      />
      <div className="flex gap-2">
        <Button
          onClick={send}
          disabled={sending || !content.trim()}
          loading={sending}
          className="flex-1"
        >
          {sending ? 'A enviar…' : 'Enviar Feedback'}
        </Button>
        <Button intent="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
