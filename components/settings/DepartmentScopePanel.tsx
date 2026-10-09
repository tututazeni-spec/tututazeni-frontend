// components/settings/DepartmentScopePanel.tsx
// Âmbito por departamento de cada perfil (ADMIN) — docs/modulo_settings.md §2.
// Sem departamentos marcados = sem restrição. ADMIN/RH nunca são limitados.
// Aplicado hoje à listagem de utilizadores (GET /users).

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { DepartmentScopes } from './types';

const UNRESTRICTED_ROLES = ['ADMIN', 'RH'];

export function DepartmentScopePanel() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<DepartmentScopes>(
    queryKeys.settings.departmentScopes(),
    '/settings/permissions/department-scope',
  );
  // Rascunho por perfil — só existe enquanto o admin edita.
  const [draft, setDraft] = useState<Record<number, number[]>>({});

  const save = useApiMutation(
    (v: { roleId: number; departmentIds: number[] }) =>
      apiClient.put(`/settings/permissions/department-scope/${v.roleId}`, {
        departmentIds: v.departmentIds,
      }),
    {
      invalidateKeys: [queryKeys.settings.departmentScopes()],
      onSuccess: (_d, v) => {
        setDraft((d) => {
          const { [v.roleId]: _gone, ...rest } = d;
          return rest;
        });
        toast({ title: 'Âmbito do perfil guardado', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading)
    return <p className="py-6 text-sm text-ink-faint">A carregar…</p>;
  if (error || !data)
    return <p className="py-6 text-sm text-danger">{error?.message}</p>;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
        Acesso por departamento
      </div>
      <CardBody>
        <p className="mb-4 text-xs text-ink-faint">
          Limita os utilizadores que cada perfil consegue listar. Sem
          departamentos marcados, o perfil vê todos. ADMIN e RH não são
          limitados.
        </p>
        <div className="space-y-4">
          {data.roles.map((role) => {
            const locked = UNRESTRICTED_ROLES.includes(role.name);
            const current = draft[role.id] ?? role.departmentIds;
            const dirty = draft[role.id] !== undefined;
            return (
              <div key={role.id} className="border-t border-border pt-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-ink">{role.name}</span>
                  {locked ? (
                    <Badge intent="neutral">Sem restrição</Badge>
                  ) : current.length === 0 ? (
                    <Badge intent="info">Todos os departamentos</Badge>
                  ) : (
                    <Badge intent="warning">
                      {current.length} departamento(s)
                    </Badge>
                  )}
                </div>
                {!locked && (
                  <>
                    <div className="grid grid-cols-3 gap-1">
                      {data.departments.map((d) => (
                        <label
                          key={d.id}
                          className="flex items-center gap-2 text-sm text-ink"
                        >
                          <input
                            type="checkbox"
                            checked={current.includes(d.id)}
                            onChange={(e) =>
                              setDraft((s) => ({
                                ...s,
                                [role.id]: e.target.checked
                                  ? [...current, d.id]
                                  : current.filter((x) => x !== d.id),
                              }))
                            }
                          />
                          {d.name}
                        </label>
                      ))}
                    </div>
                    {dirty && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          disabled={save.isPending}
                          onClick={() =>
                            save.mutate({
                              roleId: role.id,
                              departmentIds: current,
                            })
                          }
                        >
                          Guardar
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
