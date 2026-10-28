'use client';
// components/product/GettingStartedCard.tsx
//
// Checklist de "Primeiros passos" no topo do painel. Os passos vêm do backend,
// calculados a partir de dados reais (departamentos, cursos, inscrições…), por
// isso fecham sozinhos quando o trabalho está feito. Desaparece ao concluir ou
// ao ser dispensado.

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { buttonVariants } from '@/components/ui/Button';

interface Step {
  key: string;
  title: string;
  hint: string;
  href: string;
  done: boolean;
}

interface GettingStarted {
  steps: Step[];
  doneCount: number;
  total: number;
  completed: boolean;
  dismissed: boolean;
  next: Step | null;
}

const KEY = ['product-experience', 'getting-started'] as const;

export function GettingStartedCard() {
  const qc = useQueryClient();
  const { data } = useApiQuery<GettingStarted>(
    [...KEY],
    '/product-experience/getting-started',
    { retry: false, meta: { silent: true } },
  );

  if (!data || data.completed || data.dismissed) return null;

  async function dismiss() {
    await apiClient.post('/product-experience/getting-started/dismiss').catch(() => undefined);
    qc.invalidateQueries({ queryKey: [...KEY] });
  }

  return (
    <Card>
      <CardBody>
        <section aria-labelledby="primeiros-passos-titulo">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="primeiros-passos-titulo" className="font-display text-lg font-bold text-ink">
                Primeiros passos
              </h2>
              <p className="text-sm text-ink-muted">
                {data.doneCount} de {data.total} concluídos
                {data.next ? ` — a seguir: ${data.next.title.toLowerCase()}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-[44px] px-2 text-sm text-ink-muted underline"
            >
              Dispensar
            </button>
          </div>
          <ProgressBar value={Math.round((data.doneCount / data.total) * 100)} />
          <ul className="mt-4 flex flex-col gap-2">
            {data.steps.map((s) => (
              <li key={s.key} className="flex items-center gap-3">
                {s.done ? (
                  <CheckCircle2 size={20} className="shrink-0 text-success" aria-label="Concluído" />
                ) : (
                  <Circle size={20} className="shrink-0 text-ink-faint" aria-label="Por fazer" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={s.href}
                    className={s.done ? 'text-sm text-ink-muted line-through' : 'text-sm font-semibold text-ink'}
                  >
                    {s.title}
                  </Link>
                  {!s.done && <p className="text-xs text-ink-muted">{s.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
          {data.next && (
            <div className="mt-4">
              <Link href={data.next.href} className={buttonVariants({})}>
                {data.next.title}
              </Link>
            </div>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
