// components/engagement/MoodCheckin.tsx
// Widget de check-in rápido de humor. Extraído de
// app/(platform)/engagement/page.tsx.
//
// O selector de humor (5 emojis) é um padrão bespoke sem equivalente na
// fundação — mantém-se estruturalmente como está, só troca os tokens de
// cor (violeta -> primary).

'use client';

import { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MOOD_LABEL } from './constants';

export interface MoodCheckinProps {
  onDone: () => void;
}

export function MoodCheckin({ onDone }: MoodCheckinProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const checkin = useApiMutation(
    () =>
      apiClient.post('/engagement/mood/checkin', {
        mood: selected,
        note: note || undefined,
      }),
    {
      onSuccess: () => {
        setDone(true);
        onDone();
      },
    },
  );
  const submitting = checkin.isPending;
  const submit = () => {
    if (selected) checkin.mutate(undefined);
  };

  if (done)
    return (
      <div className="flex items-center gap-3 rounded-card border border-success bg-success-subtle p-4">
        <CheckCircle size={20} strokeWidth={1.75} className="text-success" />
        <p className="font-body text-sm font-medium text-success-ink">
          Check-in registado! +5 Pontos de Experiência
        </p>
      </div>
    );

  return (
    <div className="rounded-card border border-primary-subtle bg-gradient-to-br from-primary-subtle to-accent-subtle p-5">
      <p className="mb-3 font-body text-sm font-semibold text-ink">
        Como te sentes hoje?
      </p>
      <div className="mb-3 flex gap-3">
        {[5, 4, 3, 2, 1].map((m) => (
          <button
            key={m}
            onClick={() => setSelected(m)}
            className={`flex flex-col items-center gap-1 rounded-card border-2 p-2 transition-all ${
              selected === m
                ? 'scale-110 border-primary bg-surface shadow-hover'
                : 'border-transparent hover:border-primary-subtle'
            }`}
          >
            <span className="font-body text-[10px] text-ink-muted">
              {MOOD_LABEL[m]}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-2 flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota opcional (não é obrigatório)..."
            className="flex-1"
          />
          <IconButton
            icon={Send}
            label="Enviar"
            onClick={submit}
            disabled={submitting}
          />
        </div>
      )}
    </div>
  );
}
