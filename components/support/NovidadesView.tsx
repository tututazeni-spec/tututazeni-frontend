'use client';
// Separador "Novidades": registo de alterações para clientes (content/novidades.ts).

import { NOVIDADES, type NovidadeTipo } from '@/content/novidades';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const TIPO_LABEL: Record<NovidadeTipo, string> = {
  novo: 'Novo',
  melhoria: 'Melhoria',
  correcao: 'Correcção',
};

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function NovidadesView() {
  return (
    <Card>
      <CardBody>
        <h2 className="font-display text-lg font-bold text-ink">Novidades</h2>
        <ol className="mt-4 flex flex-col gap-5">
          {NOVIDADES.map((n) => (
            <li key={`${n.data}-${n.titulo}`}>
              <div className="flex flex-wrap items-center gap-2">
                <time dateTime={n.data} className="text-xs text-ink-muted">
                  {formatDay(n.data)}
                </time>
                <Badge>{TIPO_LABEL[n.tipo]}</Badge>
              </div>
              <h3 className="mt-1 text-sm font-semibold text-ink">
                {n.titulo}
              </h3>
              <p className="text-sm text-ink-muted">{n.descricao}</p>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
