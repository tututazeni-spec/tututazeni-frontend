// components/engagement/MoodCheckin.tsx
// Widget de check-in rápido de humor. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { MOOD_EMOJI, MOOD_LABEL } from './constants';

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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-emerald-500" />
        <p className="text-sm text-emerald-700 font-medium">
          Check-in registado! +5 XP 🎉
        </p>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 mb-3">
        💫 Como te sentes hoje?
      </p>
      <div className="flex gap-3 mb-3">
        {[5, 4, 3, 2, 1].map((m) => (
          <button
            key={m}
            onClick={() => setSelected(m)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
              selected === m
                ? 'border-violet-500 bg-white scale-110 shadow-md'
                : 'border-transparent hover:border-violet-200'
            }`}
          >
            <span className="text-2xl">{MOOD_EMOJI[m]}</span>
            <span className="text-[10px] text-slate-500">{MOOD_LABEL[m]}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="flex gap-2 mt-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota opcional (não é obrigatório)..."
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
          />
          <button
            onClick={submit}
            disabled={submitting}
            aria-label="Enviar"
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
