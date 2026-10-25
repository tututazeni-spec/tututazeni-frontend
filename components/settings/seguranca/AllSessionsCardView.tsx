// components/settings/seguranca/AllSessionsCardView.tsx
// Sessões activas da organização (apresentação). Dados e revogação:
// hooks/useSecuritySessions.ts.

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { OrgSessionsController } from '@/hooks/useSecuritySessions';
import { fmtDate } from './logic';

export function AllSessionsCardView({ ctl }: { ctl: OrgSessionsController }) {
  const {
    isLoading,
    total,
    items,
    revoke,
    requestRevokeAll,
    revoking,
    revokingAll,
  } = ctl;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-[#0F1F3D]/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
        Sessões activas (organização)
        {total !== undefined && <Badge intent="info">{total}</Badge>}
      </div>
      <CardBody>
        {isLoading ? (
          <p className="text-sm text-ink-faint">A carregar…</p>
        ) : !items.length ? (
          <p className="py-4 text-center text-sm text-ink-faint">
            Nenhuma sessão activa.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-faint">
                <th className="py-2">Utilizador</th>
                <th>IP</th>
                <th>Desde</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2">
                    <div className="font-medium text-ink">
                      {s.user?.fullName ?? `#${s.userId}`}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {s.user?.email}
                    </div>
                  </td>
                  <td>{s.ip ?? '—'}</td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        intent="ghost"
                        disabled={revoking}
                        onClick={() => revoke(s.id)}
                      >
                        Terminar
                      </Button>
                      <Button
                        intent="ghost"
                        disabled={revokingAll}
                        onClick={() => requestRevokeAll(s)}
                      >
                        Terminar todas
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
