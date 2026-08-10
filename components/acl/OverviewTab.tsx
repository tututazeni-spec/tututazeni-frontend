// components/acl/OverviewTab.tsx

import { Users, Shield, Key, AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
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

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Utilizadores',
            value: stats?.totalUsers ?? 0,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'Roles',
            value: stats?.totalRoles ?? 0,
            icon: Shield,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Permissões',
            value: stats?.totalPermissions ?? 0,
            icon: Key,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
          },
          {
            label: 'Acessos Negados',
            value: stats?.deniedCount ?? 0,
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm"
          >
            <div className={`p-2 rounded-lg ${k.bg} w-fit mb-2`}>
              <k.icon size={16} className={k.color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Role distribution */}
      {stats && stats.roleBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            Distribuição de Roles
          </h4>
          <div className="space-y-2">
            {stats.roleBreakdown.map((r, i) => {
              const max = stats.roleBreakdown[0].count;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-24 truncate">
                    {r.role?.name ?? 'N/A'}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-2 bg-indigo-400 rounded-full"
                      style={{ width: `${(r.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">
                    {r.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My permissions */}
      {myPerms && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Key size={14} className="text-indigo-500" />
            As Minhas Permissões ({myPerms.roleCode})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {myPerms.permissions.includes('*') ? (
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                ✅ ADMIN — Acesso Total (*)
              </span>
            ) : (
              myPerms.permissions.slice(0, 20).map((p, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-mono"
                >
                  {p}
                </span>
              ))
            )}
            {myPerms.permissions.length > 20 && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">
                +{myPerms.permissions.length - 20} mais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recent denied */}
      {stats && stats.recentDenied.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} />
            Acessos Negados Recentes
          </h4>
          <div className="space-y-1.5">
            {stats.recentDenied.map((d, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-red-600 font-medium">
                  {d.user?.fullName ?? `User ${d.userId}`}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-600">
                  {JSON.parse(d.changes ?? '{}').subject ?? d.entity}
                </span>
                <span className="text-slate-400 ml-auto">
                  {new Date(d.timestamp).toLocaleTimeString('pt')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
