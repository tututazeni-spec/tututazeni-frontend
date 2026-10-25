// components/settings/seguranca/LockedUsersCardView.tsx
// Contas bloqueadas (apresentação). Dados e desbloqueio: hooks/useLockedUsers.ts.

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { LockedUsersController } from '@/hooks/useLockedUsers';
import { fmtDate } from './logic';

export function LockedUsersCardView({ ctl }: { ctl: LockedUsersController }) {
  const { isLoading, total, items, requestUnlock, unlocking } = ctl;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
        Contas bloqueadas
        {total !== undefined && (
          <Badge intent={total ? 'danger' : 'success'}>{total}</Badge>
        )}
      </div>
      <CardBody>
        {isLoading ? (
          <p className="text-sm text-ink-faint">A carregar…</p>
        ) : !items.length ? (
          <p className="py-4 text-center text-sm text-ink-faint">
            Nenhuma conta bloqueada.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-control border border-border p-3 text-sm"
              >
                <div>
                  <p className="m-0 font-medium text-ink">{u.fullName}</p>
                  <p className="m-0 text-xs text-ink-faint">
                    {u.email} · bloqueada até{' '}
                    {u.lockedUntil ? fmtDate(u.lockedUntil) : '—'}
                  </p>
                </div>
                <Button
                  intent="primary"
                  disabled={unlocking}
                  onClick={() => requestUnlock(u)}
                >
                  Desbloquear
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
