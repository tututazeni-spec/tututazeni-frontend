// components/settings/TabUtilizadores.tsx
// Tab "Utilizadores" (ADMIN): regras de criação, campos obrigatórios, convites
// e utilizadores inactivos — /settings/users/* (docs/modulo_settings.md §3).
// A activação/desactivação individual continua em Utilizadores (PATCH /users/:id/*).

'use client';

import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useServerDraft } from '@/hooks/useServerDraft';
import { useToast } from '@/providers/ToastProvider';
import { Clock, Lock, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { InactiveUsersResult, UserPolicy, UsersOverview } from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';

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

interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
      <Checkbox
        id={id}

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

  const [policy, setPolicy] = useServerDraft<UserPolicy>(policyQuery.data);
  const [domains, setDomains] = useServerDraft<string, string[]>(
    policyQuery.data?.allowedEmailDomains,
    (d) => d.join(', '),
  );

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

  if (policyQuery.isLoading || !policy) return <Skeleton rows={4} />;
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
      allowedEmailDomains: (domains ?? '')
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
          {/* Donut solto, sem moldura de card */}
          <div className="flex items-center justify-center">
            <DonutChart
              size={150}
              hideLegend
              data={[
                {
                  label: 'Utilizadores',
                  value: o.total,
                  color: '#1877F2',
                },
                {
                  label: 'Vagas livres',
                  value: Math.max(o.maxUsers - o.total, 0),
                  color: '#D8E2F0',
                },
              ]}
              centerValue={String(o.total)}
              centerLabel={`de ${o.maxUsers.toLocaleString('pt-PT')}`}
            />
          </div>
          <NavyStatCard
            href="/users"
            icon={UserCheck}
            label="Activos"
            value={o.active}
            tone="green"
          />
          <NavyStatCard
            href="/users"
            icon={Clock}
            label="Pendentes"
            value={o.pending}
            tone="orange"
          />
          <NavyStatCard
            href="/users"
            icon={UserX}
            label="Inactivos"
            value={o.inactive}
            tone="blue"
            iconTone="gray"
          />
          <NavyStatCard
            href="/users"
            icon={Lock}
            label="Suspensos / Bloqueados"
            value={o.suspended}
            tone="red"
          />
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
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
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
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
                  value={domains ?? ''}
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

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
          Utilizadores inactivos
          {inactive.data && (
            <Badge intent={inactive.data.total ? 'warning' : 'success'}>
              {inactive.data.total} sem login há mais de{' '}
              {inactive.data.thresholdDays} dias
            </Badge>
          )}
        </div>
        <CardBody>
          {inactive.isLoading ? (
            <Skeleton rows={3} />
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
