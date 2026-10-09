// components/settings/TabUtilizadores.tsx
// Tab "Utilizadores" (ADMIN): regras de criação, campos obrigatórios, convites
// e utilizadores inactivos — /settings/users/* (docs/modulo_settings.md §3).
// A activação/desactivação individual continua em Utilizadores (PATCH /users/:id/*).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { InactiveUsersResult, UserPolicy, UsersOverview } from './types';

const FIELD_LABELS: Record<string, string> = {
  phone: 'Telefone',
  birthDate: 'Data de nascimento',
  gender: 'Género',
  employeeNumber: 'Nº de funcionário',
  departmentId: 'Departamento',
  positionId: 'Cargo',
  hireDate: 'Data de admissão',
  nif: 'NIF',
  address: 'Morada',
  roleId: 'Função',
};

const NO_ROLE = 'none';

interface RoleOption {
  id: number;
  name: string;
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function TabUtilizadores() {
  const toast = useToast();

  const overview = useApiQuery<UsersOverview>(
    queryKeys.settings.usersOverview(),
    '/settings/users/overview',
  );
  const policyQuery = useApiQuery<UserPolicy>(
    queryKeys.settings.userPolicy(),
    '/settings/users/policy',
  );
  const roles = useApiQuery<RoleOption[]>(
    queryKeys.settings.roles(),
    '/roles-permissions',
  );
  const inactive = useApiQuery<InactiveUsersResult>(
    queryKeys.settings.inactiveUsers(),
    '/settings/users/inactive',
  );

  const [policy, setPolicy] = useState<UserPolicy | null>(null);
  const [domains, setDomains] = useState('');

  useEffect(() => {
    if (policyQuery.data) {
      setPolicy(policyQuery.data);
      setDomains(policyQuery.data.allowedEmailDomains.join(', '));
    }
  }, [policyQuery.data]);

  const save = useApiMutation(
    (payload: Omit<UserPolicy, 'requiredFieldOptions'>) =>
      apiClient.put('/settings/users/policy', payload),
    {
      invalidateKeys: [
        queryKeys.settings.userPolicy(),
        queryKeys.settings.inactiveUsers(),
      ],
      onSuccess: () =>
        toast({
          title: 'Política de utilizadores guardada',
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const deactivate = useApiMutation(
    (id: number) =>
      apiClient.patch(`/users/${id}/deactivate`, {
        reason: 'Inactividade (Definições > Utilizadores)',
      }),
    {
      invalidateKeys: [
        queryKeys.settings.inactiveUsers(),
        queryKeys.settings.usersOverview(),
      ],
      onSuccess: () =>
        toast({ title: 'Utilizador desactivado', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (policyQuery.isLoading || !policy)
    return (
      <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>
    );
  if (policyQuery.error)
    return (
      <p className="py-10 text-center text-sm text-danger">
        {policyQuery.error.message}
      </p>
    );

  const patch = (p: Partial<UserPolicy>) =>
    setPolicy((cur) => (cur ? { ...cur, ...p } : cur));

  function toggleField(field: string, on: boolean) {
    if (!policy) return;
    patch({
      requiredFields: on
        ? [...policy.requiredFields, field]
        : policy.requiredFields.filter((f) => f !== field),
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!policy) return;
    const { requiredFieldOptions: _opts, ...rest } = policy;
    save.mutate({
      ...rest,
      allowedEmailDomains: domains
        .split(/[,\s;]+/)
        .map((d) => d.trim())
        .filter(Boolean),
    });
  }

  const o = overview.data;
  const roleItems = [
    { value: NO_ROLE, label: 'Sem função por omissão' },
    ...(roles.data ?? []).map((r) => ({ value: String(r.id), label: r.name })),
  ];

  return (
    <div className="space-y-4">
      {o && (
        <div className="grid grid-cols-5 gap-4">
          {[
            ['Total', `${o.total} / ${o.maxUsers}`],
            ['Activos', o.active],
            ['Pendentes', o.pending],
            ['Inactivos', o.inactive],
            ['Suspensos/Bloqueados', o.suspended],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <CardBody>
                <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Campos obrigatórios na criação
          </div>
          <CardBody>
            <p className="mb-4 text-xs text-ink-faint">
              Aplicado a Novo utilizador e importações. No convite só se exigem
              Função e Departamento.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {policy.requiredFieldOptions.map((f) => (
                <Toggle
                  key={f}
                  id={`req-${f}`}
                  label={FIELD_LABELS[f] ?? f}
                  checked={policy.requiredFields.includes(f)}
                  onChange={(v) => toggleField(f, v)}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Regras de criação e convite
          </div>
          <CardBody>
            <div className="space-y-4">
              <FormField
                label="Domínios de email autorizados"
                htmlFor="domains"
                hint="Separados por vírgula. Vazio = qualquer domínio."
              >
                <Input
                  id="domains"
                  className="w-full"
                  placeholder="empresa.ao, empresa.com"
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                />
              </FormField>
              <FormField label="Função por omissão" htmlFor="defaultRole">
                <Select
                  className="w-full"
                  items={roleItems}
                  value={
                    policy.defaultRoleId
                      ? String(policy.defaultRoleId)
                      : NO_ROLE
                  }
                  onValueChange={(v) =>
                    patch({ defaultRoleId: v === NO_ROLE ? null : Number(v) })
                  }
                />
              </FormField>
              <FormField
                label="Validade do convite (dias)"
                htmlFor="inviteDays"
              >
                <Input
                  id="inviteDays"
                  type="number"
                  min={1}
                  max={90}
                  className="w-full"
                  value={policy.invitationExpiryDays}
                  onChange={(e) =>
                    patch({ invitationExpiryDays: Number(e.target.value) })
                  }
                />
              </FormField>
              <FormField
                label="Inactivo após (dias sem login)"
                htmlFor="inactiveDays"
              >
                <Input
                  id="inactiveDays"
                  type="number"
                  min={7}
                  max={730}
                  className="w-full"
                  value={policy.inactiveAfterDays}
                  onChange={(e) =>
                    patch({ inactiveAfterDays: Number(e.target.value) })
                  }
                />
              </FormField>
              <Toggle
                id="invites"
                label="Permitir convite de utilizadores"
                checked={policy.invitesEnabled}
                onChange={(v) => patch({ invitesEnabled: v })}
              />
              <Toggle
                id="forcePwd"
                label="Trocar palavra-passe temporária no primeiro login"
                checked={policy.forcePasswordChangeOnFirstLogin}
                onChange={(v) => patch({ forcePasswordChangeOnFirstLogin: v })}
              />
            </div>
          </CardBody>
        </Card>

        <div className="col-span-2 flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'A guardar…' : 'Guardar política'}
          </Button>
        </div>
      </form>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">
              Utilizadores inactivos
            </h3>
            {inactive.data && (
              <Badge intent={inactive.data.total ? 'warning' : 'success'}>
                {inactive.data.total} sem login há mais de{' '}
                {inactive.data.thresholdDays} dias
              </Badge>
            )}
          </div>
          {inactive.isLoading ? (
            <p className="text-sm text-ink-faint">A carregar…</p>
          ) : !inactive.data?.items.length ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              Nenhum utilizador inactivo.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-faint">
                  <th className="py-2">Nome</th>
                  <th>Departamento</th>
                  <th>Função</th>
                  <th>Último login</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {inactive.data.items.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="py-2">
                      <div className="font-medium text-ink">{u.fullName}</div>
                      <div className="text-xs text-ink-faint">{u.email}</div>
                    </td>
                    <td>{u.department?.name ?? '—'}</td>
                    <td>{u.role?.name ?? '—'}</td>
                    <td>
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString('pt-PT')
                        : 'Nunca'}
                    </td>
                    <td className="text-right">
                      <Button
                        intent="ghost"
                        disabled={deactivate.isPending}
                        onClick={() => deactivate.mutate(u.id)}
                      >
                        Desactivar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
