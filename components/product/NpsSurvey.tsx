'use client';
// components/product/NpsSurvey.tsx
//
// Sondagem NPS de uma pergunta. O backend decide se aparece (conta com 7+ dias,
// sem resposta nos últimos 90). "Agora não" esconde-a nesta sessão do navegador.

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { friendlyMessage } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';

const SNOOZE_KEY = 'innova:nps-snoozed';

function snoozed(): boolean {
  try {
    return sessionStorage.getItem(SNOOZE_KEY) === '1';
  } catch {
    return false;
  }
}

export function NpsSurvey() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(snoozed);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { data } = useApiQuery<{ eligible: boolean }>(
    ['product-experience', 'nps-eligibility'],
    '/product-experience/nps/eligibility',
    { staleTime: 60 * 60_000, retry: false, meta: { silent: true } },
  );

  if (hidden || !data?.eligible) return null;

  function snooze() {
    try {
      sessionStorage.setItem(SNOOZE_KEY, '1');
    } catch {
      // sem sessionStorage: esconde só até ao próximo reload
    }
    setHidden(true);
  }

  async function submit() {
    if (score === null) return;
    setSending(true);
    setError(undefined);
    try {
      await apiClient.post('/product-experience/nps', {
        score,
        comment: comment.trim() || undefined,
        page: pathname,
      });
      setDone(true);
      setTimeout(() => setHidden(true), 2500);
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      aria-label="Sondagem de satisfação"
      className="fixed bottom-4 right-4 z-[110] w-[calc(100vw-2rem)] max-w-md rounded-panel border border-border bg-surface p-4 shadow-lg"
    >
      {done ? (
        <p role="status" className="text-sm font-semibold text-ink">
          Obrigado! A sua resposta ajuda-nos a melhorar.
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <p id="nps-question" className="text-sm font-semibold text-ink">
              Qual a probabilidade de recomendar o INNOVA a um colega?
            </p>
            <button
              type="button"
              onClick={snooze}
              aria-label="Agora não"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-muted"
            >
              <X size={16} />
            </button>
          </div>
          <div
            role="radiogroup"
            aria-labelledby="nps-question"
            className="mt-3 grid grid-cols-11 gap-1"
          >
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={score === n}
                onClick={() => setScore(n)}
                className={cn(
                  'min-h-[44px] rounded-control border text-xs font-semibold',
                  score === n
                    ? 'border-brand bg-brand text-white'
                    : 'border-field bg-surface text-ink',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
            <span>Nada provável</span>
            <span>Muito provável</span>
          </div>
          {score !== null && (
            <div className="mt-3 flex flex-col gap-3">
              <Textarea
                rows={2}
                maxLength={2000}
                aria-label="Quer dizer-nos porquê? (opcional)"
                placeholder="Quer dizer-nos porquê? (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {error && (
                <p role="alert" className="text-xs text-danger">
                  {error}
                </p>
              )}
              <Button type="button" onClick={submit} loading={sending}>
                Enviar
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
