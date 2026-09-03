// components/acl/OverviewTab.tsx

import { Users, Shield, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import type { AclStats, MyPermissions } from './types';

export function OverviewTab() {
  const statsQ = useApiQuery<AclStats>(queryKeys.acl.stats(), '/acl/stats', {
    staleTime: STALE_TIME.DYNAMIC,
  });
  const permsQ = useApiQuery<MyPermissions>(
    queryKeys.acl.myPermissions(),
    '/acl/my-permissions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const stats = statsQ.data ?? null;
  const myPerms = permsQ.data ?? null;
  const loading = statsQ.isLoading;

  if (loading)
    return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Utilizadores"
          value={stats?.totalUsers ?? 0}
          intent="primary"
        />
        <KpiCard
          icon={Shield}
          label="Roles"
          value={stats?.totalRoles ?? 0}
          intent="accent"
        />
        <KpiCard
          icon={Key}
          label="Permissões"
          value={stats?.totalPermissions ?? 0}
          intent="info"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Acessos Negados"
          value={stats?.deniedCount ?? 0}
          intent="danger"
        />
      </div>

      {/* Role distribution */}
      {stats && stats.roleBreakdown.length > 0 && (
        <Card className="p-5">
          <h4 className="mb-4 font-semibold text-ink">Distribuição de Roles</h4>
          <div className="space-y-2">
            {stats.roleBreakdown.map((r, i) => {
              const max = stats.roleBreakdown[0].count;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 truncate font-medium text-ink-muted text-xs">
                    {r.role?.name ?? 'N/A'}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-surface">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(r.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-ink text-xs">
                    {r.count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* My permissions */}
      {myPerms && (
        <Card className="p-5">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <Key size={14} strokeWidth={1.75} className="text-primary" />
            As Minhas Permissões ({myPerms.roleCode})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {myPerms.permissions.includes('*') ? (
              <span className="rounded-control bg-success-subtle px-2 py-1 font-bold text-success-ink text-xs">
                <CheckCircle2
                  size={14}
                  strokeWidth={1.75}
                  className="inline align-[-2px]"
                />{' '}
                ADMIN — Acesso Total (*)
              </span>
            ) : (
              myPerms.permissions.slice(0, 20).map((p, i) => (
                <span
                  key={i}
                  className="rounded-control bg-surface px-2 py-0.5 font-mono text-ink text-xs"
                >
                  {p}
                </span>
              ))
            )}
            {myPerms.permissions.length > 20 && (
              <span className="rounded-control bg-surface px-2 py-0.5 text-ink-muted text-xs">
                +{myPerms.permissions.length - 20} mais
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Recent denied */}
      {stats && stats.recentDenied.length > 0 && (
        <Card className="border-danger-subtle bg-danger-subtle p-5">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle size={14} strokeWidth={1.75} />
            Acessos Negados Recentes
          </h4>
          <div className="space-y-1.5">
            {stats.recentDenied.map((d, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="font-medium text-danger">
                  {d.user?.fullName ?? `User ${d.userId}`}
                </span>
                <span className="text-ink-faint">·</span>
                <span className="font-mono text-ink-muted">
                  {JSON.parse(d.changes ?? '{}').subject ?? d.entity}
                </span>
                <span className="ml-auto text-ink-faint">
                  {new Date(d.timestamp).toLocaleTimeString('pt')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
