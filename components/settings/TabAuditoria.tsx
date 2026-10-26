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
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTimeNumeric } from '@/lib/format';

const HEALTH_LABELS: Record<
  string,
  { label: string; intent: 'success' | 'danger' | 'neutral' }
> = {
  OK: { label: 'Saudável', intent: 'success' },
  WARNING: { label: 'Atenção', intent: 'danger' },
  DISABLED: { label: 'Desactivada', intent: 'neutral' },
};

// Eventos obrigatórios da política ("tipo de evento" técnico) em português.
const EVENT_PT: Record<string, string> = {
  LOGIN: 'Início de sessão',
  FAILED: 'Operação falhada',
  CREATE: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Eliminação',
  APPROVE: 'Aprovação',
  REJECT: 'Rejeição',
  EXPORT: 'Exportação',
  PERMISSION: 'Alteração de permissões',
};

// Cores de estado do card ROI Total.
const HEALTH_COLORS = {
  success: '#34D399',
  danger: '#F87171',
  neutral: '#9CA3AF',
};

export function TabAuditoria() {
  const { data, isLoading, error } = useApiQuery<AuditDataOverview>(
    queryKeys.settings.auditOverview(),
    '/settings/audit',
  );

  if (isLoading || !data) return <Skeleton rows={4} />;
  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );

  const health = HEALTH_LABELS[data.health] ?? HEALTH_LABELS.DISABLED;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div className="pointer-events-none flex cursor-default select-none items-center justify-between bg-brand/60 px-5 py-3">
          <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
            Registo de logs
          </h3>
          <span
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
            style={{ color: HEALTH_COLORS[health.intent] }}
          >
            {health.label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 px-6 pt-5">
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Eventos (24h)
            </p>
            <p className="mt-1 text-2xl font-display font-bold text-brand">
              {data.events24h}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Falhas (24h)
            </p>
            <p className="mt-1 text-2xl font-display font-bold text-brand">
              {data.failedOperations24h}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Acessos negados (24h)
            </p>
            <p className="mt-1 text-2xl font-display font-bold text-brand">
              {data.deniedOperations24h}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Último evento
            </p>
            <p className="mt-1 text-sm text-brand">
              {data.lastEventAt
                ? formatDateTimeNumeric(data.lastEventAt)
                : '—'}
            </p>
          </div>
        </div>
        <div className="px-6 pb-5 pt-4">
          <Link href={data.links.logs}>
            <Button type="button" intent="secondary">
              Ver registo completo de logs
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Estado dos backups
          </div>
          <CardBody>
            {data.backup.configured ? (
              <>
                <p className="m-0 text-sm text-ink">
                  Destino: {data.backup.destination}
                </p>
                <p className="m-0 text-sm text-ink">
                  Periodicidade: {data.backup.frequency}
                </p>
              </>
            ) : (
              <p className="m-0 text-sm text-ink-faint">
                Sem destino de backup configurado.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-brand/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">
            Exportação de dados
            <Link href={data.links.exports}>
              <Button type="button" intent="secondary">
                Gerir exportações
              </Button>
            </Link>
          </div>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {data.exports.byStatus.map((s) => (
                <Badge key={s.status} intent="neutral">
                  {s.status}: {s.count}
                </Badge>
              ))}
              {data.exports.expiredPendingPurge > 0 && (
                <Badge intent="danger">
                  {data.exports.expiredPendingPurge} expiradas por purgar
                </Badge>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div className="pointer-events-none flex cursor-default select-none items-center justify-between bg-brand/60 px-5 py-3">
          <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
            Política de auditoria
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 pt-5 text-sm text-brand">
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Módulos cobertos
            </p>
            <p className="mt-1">
              {data.policy.coveredModules.join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Eventos obrigatórios
            </p>
            <p className="mt-1">
              {data.policy.requiredEvents
                .map((e) => EVENT_PT[e.toUpperCase()] ?? e)
                .join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Pode consultar
            </p>
            <p className="mt-1">{data.policy.viewRoles.join(', ')}</p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-brand-muted">
              Pode exportar
            </p>
            <p className="mt-1">{data.policy.exportRoles.join(', ')}</p>
          </div>
        </div>
        <div className="px-6 pb-5 pt-4">
          <Link href={data.links.policy}>
            <Button type="button" intent="secondary">
              Editar regras de auditoria
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
