// components/scalability/LicensePanel.tsx
// Aba "Licença" do módulo de Escalabilidade — plano, limites e validade do
// inquilino. Só o super administrador (User.isSuperAdmin) a vê e edita; o
// backend volta a validar em PATCH /scalability/tenants/:id. É aqui que a aba
// Definições > Licença e Módulos manda gerir o plano.

'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useScalabilityDashboard } from '@/hooks/useScalability';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/providers/ToastProvider';

const PLAN_ITEMS = [
  { value: 'STARTER', label: 'Starter' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

interface TenantLicense {
  id: string;
  tenantName: string;
  tenantCode: string;
  plan: string;
  maxUsers: number;
  maxStorageGb: number;
  isActive: boolean;
  trialEndsAt: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
}

interface LicenseDraft {
  plan: string;
  maxUsers: string;
  maxStorageGb: string;
  isActive: boolean;
  trialEndsAt: string;
  contractStartDate: string;
  contractEndDate: string;
}

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

function toDraft(t: TenantLicense): LicenseDraft {
  return {
    plan: t.plan,
    maxUsers: String(t.maxUsers),
    maxStorageGb: String(t.maxStorageGb),
    isActive: t.isActive,
    trialEndsAt: toDateInput(t.trialEndsAt),
    contractStartDate: toDateInput(t.contractStartDate),
    contractEndDate: toDateInput(t.contractEndDate),
  };
}

function LicenseForm({ tenant }: { tenant: TenantLicense }) {
  const notify = useToast();
  const [draft, setDraft] = useState<LicenseDraft>(() => toDraft(tenant));
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<LicenseDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const save = useApiMutation<unknown, Record<string, unknown>>(
    (payload) => apiClient.patch(`/scalability/tenants/${tenant.id}`, payload),
    {
      invalidateKeys: [
        queryKeys.scalability.dashboard(),
        queryKeys.scalability.tenant(tenant.id),
        queryKeys.settings.license(),
      ],
    },
  );

  const submit = () => {
    setError(null);
    const users = Number(draft.maxUsers);
    const storage = Number(draft.maxStorageGb);
    if (!Number.isInteger(users) || users < 1)
      return setError('Utilizadores máximos: inteiro ≥ 1.');
    if (!Number.isInteger(storage) || storage < 1)
      return setError('Armazenamento máximo: inteiro ≥ 1 GB.');
    if (
      draft.contractStartDate &&
      draft.contractEndDate &&
      draft.contractEndDate < draft.contractStartDate
    )
      return setError('O fim do contrato não pode ser anterior ao início.');

    const payload: Record<string, unknown> = {
      plan: draft.plan,
      maxUsers: users,
      maxStorageGb: storage,
      isActive: draft.isActive,
    };
    if (draft.trialEndsAt) payload.trialEndsAt = draft.trialEndsAt;
    if (draft.contractStartDate)
      payload.contractStartDate = draft.contractStartDate;
    if (draft.contractEndDate) payload.contractEndDate = draft.contractEndDate;

    save.mutate(payload, {
      onSuccess: () =>
        notify({ title: 'Licença actualizada', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'LicensePanel.submit' });
        notify({
          title: 'Não foi possível actualizar a licença',
          intent: 'danger',
        });
      },
    });
  };

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
            <Building2 size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              {tenant.tenantName}
            </h3>
            <p className="font-body text-xs text-ink-muted">
              Código {tenant.tenantCode} · visível e editável apenas pelo super
              administrador.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Plano" htmlFor="lic-plan">
            <Select
              items={PLAN_ITEMS}
              value={draft.plan}
              onValueChange={(plan) => set({ plan })}
            />
          </FormField>
          <FormField label="Utilizadores máximos" htmlFor="lic-users">
            <Input
              id="lic-users"
              type="number"
              min={1}
              value={draft.maxUsers}
              onChange={(e) => set({ maxUsers: e.target.value })}
            />
          </FormField>
          <FormField label="Armazenamento máximo (GB)" htmlFor="lic-storage">
            <Input
              id="lic-storage"
              type="number"
              min={1}
              value={draft.maxStorageGb}
              onChange={(e) => set({ maxStorageGb: e.target.value })}
            />
          </FormField>
          <FormField label="Fim do período de teste" htmlFor="lic-trial">
            <Input
              id="lic-trial"
              type="date"
              value={draft.trialEndsAt}
              onChange={(e) => set({ trialEndsAt: e.target.value })}
            />
          </FormField>
          <FormField label="Início do contrato" htmlFor="lic-start">
            <Input
              id="lic-start"
              type="date"
              value={draft.contractStartDate}
              onChange={(e) => set({ contractStartDate: e.target.value })}
            />
          </FormField>
          <FormField label="Fim do contrato (validade)" htmlFor="lic-end">
            <Input
              id="lic-end"
              type="date"
              value={draft.contractEndDate}
              onChange={(e) => set({ contractEndDate: e.target.value })}
            />
          </FormField>
        </div>

        <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink">
          <Checkbox
            checked={draft.isActive}
            onChange={() => set({ isActive: !draft.isActive })}
          />
          Inquilino activo
        </label>

        {error && (
          <p role="alert" className="font-body text-sm text-danger-ink">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={submit} loading={save.isPending}>
            Guardar licença
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function LicensePanel() {
  const { data: dashboard } = useScalabilityDashboard();
  const tenantId = dashboard?.tenantInfo.id;
  const { data: tenant, isLoading } = useApiQuery<TenantLicense>(
    queryKeys.scalability.tenant(tenantId ?? ''),
    `/scalability/tenants/${tenantId}`,
    { enabled: !!tenantId },
  );

  if (isLoading || !tenant) return <Skeleton rows={4} />;
  // key: remonta o formulário se o servidor devolver outro estado após gravar.
  return <LicenseForm key={tenant.id} tenant={tenant} />;
}
