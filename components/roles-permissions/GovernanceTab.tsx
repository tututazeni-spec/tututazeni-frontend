// components/roles-permissions/GovernanceTab.tsx
// Tab "Governança": KPIs, alertas, distribuição de utilizadores por
// role e roles sem utilizadores. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { AlertTriangle, Key, Shield, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { GovernanceData } from './types';

export function GovernanceTab() {
  const { data, isLoading: loading } = useApiQuery<GovernanceData>(
    queryKeys.rolesPermissions.governance(),
    '/roles-permissions/governance-stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Roles',
            value: data?.totalRoles ?? 0,
            icon: Shield,
            color: 'text-indigo-600',
          },
          {
            label: 'Permissões',
            value: data?.totalPermissions ?? 0,
            icon: Key,
            color: 'text-teal-600',
          },
          {
            label: 'Sem Role',
            value: data?.usersWithoutRole ?? 0,
            icon: Users,
            color:
              (data?.usersWithoutRole ?? 0) > 0
                ? 'text-red-600'
                : 'text-emerald-600',
          },
          {
            label: 'Acessos Negados',
            value: data?.deniedAccesses ?? 0,
            icon: AlertTriangle,
            color:
              (data?.deniedAccesses ?? 0) > 50
                ? 'text-red-600'
                : 'text-slate-600',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <k.icon size={16} className={`${k.color} mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(data?.alerts ?? []).map((a, i) => (
            <div
              key={i}
              className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${a.type === 'ALERT' ? 'bg-red-50 border-red-200' : a.type === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}
            >
              <AlertTriangle
                size={14}
                className={
                  a.type === 'ALERT'
                    ? 'text-red-500'
                    : a.type === 'WARNING'
                      ? 'text-amber-500'
                      : 'text-blue-500'
                }
              />
              <p className="text-sm">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Role distribution */}
      {(data?.usersPerRole ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            Utilizadores por Role
          </h4>
          {(data?.usersPerRole ?? []).map((r, i) => {
            const max = (data?.usersPerRole ?? [])[0].count;
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">
                    {r.role?.name ?? 'N/A'}
                  </span>
                  <span className="font-bold text-slate-700">{r.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div
                    className="h-2 bg-indigo-400 rounded-full"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unused roles */}
      {(data?.unusedRoles ?? []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-700 mb-2">
            ⚠️ Roles sem Utilizadores
          </h4>
          <div className="flex flex-wrap gap-2">
            {(data?.unusedRoles ?? []).map((r, i) => (
              <span
                key={i}
                className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded"
              >
                {r.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
