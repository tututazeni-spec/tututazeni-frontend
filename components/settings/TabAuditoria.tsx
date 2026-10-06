// components/settings/TabAuditoria.tsx
// Tab "Auditoria e Dados" (ADMIN/AUDITOR): resumo — GET /settings/audit
// (docs/modulo_settings.md §10). O módulo de Auditoria já implementa consulta
// de logs, exportação e política; aqui só se mostra o estado e liga-se a ele.

'use client';

import Link from 'next/link';
import { queryKeys } from '@/lib/queryKeys';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { AuditDataOverview } from './types';

const HEALTH_LABELS: Record<string, { label: string; intent: 'success' | 'danger' | 'neutral' }> = {
  OK: { label: 'Saudável', intent: 'success' },
  WARNING: { label: 'Atenção', intent: 'danger' },
  DISABLED: { label: 'Desactivada', intent: 'neutral' },
};

export function TabAuditoria() {
  const { data, isLoading, error } = useApiQuery<AuditDataOverview>(
    queryKeys.settings.auditOverview(),
    '/settings/audit',
  );

  if (isLoading || !data) return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

  const health = HEALTH_LABELS[data.health] ?? HEALTH_LABELS.DISABLED;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Registo de logs</h3>
            <Badge intent={health.intent}>{health.label}</Badge>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Eventos (24h)</p>
              <p className="mt-1 text-2xl font-bold text-ink">{data.events24h}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Falhas (24h)</p>
              <p className="mt-1 text-2xl font-bold text-ink">{data.failedOperations24h}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Acessos negados (24h)</p>
              <p className="mt-1 text-2xl font-bold text-ink">{data.deniedOperations24h}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Último evento</p>
              <p className="mt-1 text-sm text-ink">
                {data.lastEventAt ? new Date(data.lastEventAt).toLocaleString('pt-PT') : '—'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link href={data.links.logs}>
              <Button type="button" intent="secondary">Ver registo completo de logs</Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Estado dos backups</h3>
            {data.backup.configured ? (
              <>
                <p className="m-0 text-sm text-ink">Destino: {data.backup.destination}</p>
                <p className="m-0 text-sm text-ink">Periodicidade: {data.backup.frequency}</p>
              </>
            ) : (
              <p className="m-0 text-sm text-ink-faint">Sem destino de backup configurado.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Exportação de dados</h3>
              <Link href={data.links.exports}>
                <Button type="button" intent="secondary">Gerir exportações</Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.exports.byStatus.map((s) => (
                <Badge key={s.status} intent="neutral">
                  {s.status}: {s.count}
                </Badge>
              ))}
              {data.exports.expiredPendingPurge > 0 && (
                <Badge intent="danger">{data.exports.expiredPendingPurge} expiradas por purgar</Badge>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Política de auditoria</h3>
            <Link href={data.links.policy}>
              <Button type="button" intent="secondary">Editar regras de auditoria</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-ink">
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Módulos cobertos</p>
              <p className="mt-1">{data.policy.coveredModules.join(', ') || '—'}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Eventos obrigatórios</p>
              <p className="mt-1">{data.policy.requiredEvents.join(', ') || '—'}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Pode consultar</p>
              <p className="mt-1">{data.policy.viewRoles.join(', ')}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Pode exportar</p>
              <p className="mt-1">{data.policy.exportRoles.join(', ')}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
