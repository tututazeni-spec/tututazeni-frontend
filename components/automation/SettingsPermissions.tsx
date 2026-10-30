// components/automation/SettingsPermissions.tsx
// Matriz de permissões por perfil (§10): consultar, criar, editar, testar,
// activar, executar, cancelar, eliminar + âmbito (todas / só o departamento).
// O perfil ADMIN é fixo; retirar "consultar" retira tudo (regra do backend).

'use client';

import { Activity, Lock } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/providers/ToastProvider';
import type { PermissionAction, PermissionMatrix, RoleGrant } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

const ACTION_LABEL: Record<PermissionAction, string> = {
  view: 'Consultar',
  create: 'Criar',
  edit: 'Editar',
  test: 'Testar',
  activate: 'Activar',
  execute: 'Executar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
};
const SCOPE_ITEMS = [
  { value: 'ALL', label: 'Todas as automações' },
  { value: 'DEPARTMENT', label: 'Só o seu departamento' },
];

export function PermissionsPanel() {
  const notify = useToast();
  const { data, isLoading } = useApiQuery<PermissionMatrix>(
    queryKeys.automation.permissions(),
    '/automation/permissions',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const update = useApiMutation(
    ({
      roleCode,
      patch,
    }: {
      roleCode: string;
      patch: Partial<Record<PermissionAction, boolean>> & {
        scope?: 'ALL' | 'DEPARTMENT';
      };
    }) => apiClient.put(`/automation/permissions/${roleCode}`, patch),
    {
      invalidateKeys: [queryKeys.automation.permissions()],
      onSuccess: () =>
        notify({ title: 'Permissões actualizadas', intent: 'success' }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm text-ink-muted">
        Define o que cada perfil pode fazer no módulo. Retirar “Consultar”
        retira todas as outras permissões. O perfil ADMIN tem sempre acesso
        total.
      </p>
      <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-resting">
        <table className="w-full min-w-[820px] font-body text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted">
              <th className="px-4 py-2.5">Perfil</th>
              {data.actions.map((a) => (
                <th key={a} className="px-2 py-2.5 text-center">
                  {ACTION_LABEL[a]}
                </th>
              ))}
              <th className="px-4 py-2.5">Âmbito</th>
            </tr>
          </thead>
          <tbody>
            {data.roles.map((r: RoleGrant) => (
              <tr
                key={r.roleCode}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-2.5 font-semibold text-brand">
                  <span className="inline-flex items-center gap-1.5">
                    {r.roleCode}
                    {r.locked && (
                      <Lock
                        size={12}
                        strokeWidth={1.75}
                        aria-label="Perfil fixo"
                      />
                    )}
                  </span>
                </td>
                {data.actions.map((a) => (
                  <td key={a} className="px-2 py-2.5 text-center">
                    <Checkbox
                      aria-label={`${r.roleCode}: ${ACTION_LABEL[a]}`}
                      checked={r.actions[a]}
                      disabled={r.locked || update.isPending}
                      onChange={(e) =>
                        update.mutate({
                          roleCode: r.roleCode,
                          patch: { [a]: e.target.checked },
                        })
                      }
                    />
                  </td>
                ))}
                <td className="px-4 py-2.5">
                  <Select
                    variant="underline"
                    icon={Activity}
                    items={SCOPE_ITEMS}
                    value={r.scope}
                    disabled={r.locked || update.isPending}
                    onValueChange={(v) =>
                      update.mutate({
                        roleCode: r.roleCode,
                        patch: { scope: v as 'ALL' | 'DEPARTMENT' },
                      })
                    }
                    className="min-w-[200px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
