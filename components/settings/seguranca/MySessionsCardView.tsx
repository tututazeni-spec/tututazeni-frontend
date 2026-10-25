// components/settings/seguranca/MySessionsCardView.tsx
// As minhas sessões activas (apresentação). Dados: hooks/useSecuritySessions.ts.

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { MySessionsController } from '@/hooks/useSecuritySessions';
import { fmtDate } from './logic';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export function MySessionsCardView({ ctl }: { ctl: MySessionsController }) {
  const { isLoading, items, revoke, revoking } = ctl;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
        As minhas sessões activas
      </div>
      <CardBody>
        {isLoading ? (
          <Skeleton rows={3} />
        ) : !items.length ? (
          <EmptyState variant="inline" title="Nenhuma sessão activa" />
        ) : (
          <div className="space-y-2">
            {items.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-control border border-border p-3 text-sm"
              >
                <div>
                  <p className="m-0 text-ink">
                    {s.userAgent ?? 'Dispositivo desconhecido'}
                  </p>
                  <p className="m-0 text-xs text-ink-faint">
                    {s.ip ?? '—'} · desde {fmtDate(s.createdAt)}
                  </p>
                </div>
                <Button
                  intent="ghost"
                  disabled={revoking}
                  onClick={() => revoke(s.id)}
                >
                  Terminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
