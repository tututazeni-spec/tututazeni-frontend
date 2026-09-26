// components/roi-impact/ConfigTab.tsx
// Tab "Configurações" (docs/roi-impact.md §11) — singleton persistido em
// RoiConfig (backend: roi-config.service.ts#getConfig/updateConfig, mesmo
// padrão de components/ai-tutor/SettingsView.tsx). Guarda a moeda, os
// defaults de metodologia (fator de isolamento por tipo de iniciativa,
// períodos de medição), o limiar de custo que obriga medição de Nível 4/5,
// as fórmulas de conversão de benefícios não financeiros, as permissões de
// acesso ao ROI financeiro e os limiares de alerta. Estes valores são
// consumidos como defaults pelo wizard "Nova Análise de ROI" (ver
// NewRoiAnalysisWizard.tsx) — a aplicação de permissões de acesso e o
// disparo automático de alertas ficam fora deste âmbito (o RH define aqui a
// intenção; não há ainda enforcement de RBAC nem um job de alertas ligado a
// estes campos).

'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { AUTHENTICATED_ROLES, type Role } from '@/lib/roles';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { INITIATIVE_TYPE_LABELS, BENEFIT_TYPE_LABELS } from './utils';
import type { RoiConfigData } from './types';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  RH: 'RH',
  GESTOR: 'Gestor',
  LIDER: 'Líder',
  COLABORADOR: 'Colaborador',
  INSTRUCTOR: 'Instrutor',
  DIRECTOR: 'Direção',
  AUDITOR: 'Auditor',
};

function RoleCheckboxGroup({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  const toggle = (role: Role) => {
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);
  };
  return (
    <div className="flex flex-wrap gap-3">
      {AUTHENTICATED_ROLES.map((role) => (
        <label key={role} className="flex items-center gap-1.5 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(role)}
            onChange={() => toggle(role)}
            className="h-4 w-4 rounded border-border-strong accent-primary"
          />
          {ROLE_LABELS[role]}
        </label>
      ))}
    </div>
  );
}

function ValidatorChip({ id, onRemove }: { id: number; onRemove: () => void }) {
  const { data: user } = useApiQuery<DirectoryUser>(queryKeys.users.detail(id), `/users/${id}`, {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  return (
    <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
      <Avatar name={user?.fullName ?? `#${id}`} url={user?.avatarUrl ?? undefined} size="sm" />
      <span className="text-sm text-ink">{user?.fullName ?? `Utilizador #${id}`}</span>
      <button
        type="button"
        aria-label="Remover responsável"
        onClick={onRemove}
        className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function ConfigTab() {
  const notify = useToast();
  const { data, isLoading: loading } = useApiQuery<RoiConfigData>(
    queryKeys.roiImpact.config(),
    '/roi-impact/config',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const [form, setForm] = useState<RoiConfigData | null>(null);
  const [periodsText, setPeriodsText] = useState('');

  useEffect(() => {
    if (data) {
      setForm(data);
      setPeriodsText(data.defaultMeasurementPeriods.join(', '));
    }
  }, [data]);

  const saveMutation = useApiMutation(
    (payload: Partial<RoiConfigData>) =>
      apiClient.patch<RoiConfigData>('/roi-impact/config', payload),
    {
      invalidateKeys: [queryKeys.roiImpact.config()],
      onSuccess: () => notify({ title: 'Configurações guardadas', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const addValidator = (u: DirectoryUser | null) => {
    if (!u || !form || form.defaultBenefitValidatorIds.includes(u.id)) return;
    setForm({ ...form, defaultBenefitValidatorIds: [...form.defaultBenefitValidatorIds, u.id] });
  };

  if (loading || !form)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  const handleSave = () => {
    const periods = periodsText
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    saveMutation.mutate({ ...form, defaultMeasurementPeriods: periods });
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-3">
          Moeda &amp; custo de capital
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Moeda" htmlFor="roi-cfg-currency">
            <Input
              id="roi-cfg-currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full"
            />
          </FormField>
          <FormField label="Taxa de desconto / custo de capital (%)" htmlFor="roi-cfg-discount">
            <Input
              id="roi-cfg-discount"
              type="number"
              step={0.1}
              placeholder="Não aplicável"
              value={form.discountRatePercent ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountRatePercent: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full"
            />
          </FormField>
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-1">
          Fator de isolamento padrão por tipo de iniciativa
        </div>
        <p className="font-body text-xs text-ink-faint mb-3">
          Pré-preenche a Etapa 4 (Metodologia) do assistente &quot;Nova Análise de ROI&quot; — quanto
          do resultado é atribuível à iniciativa (0–1), por omissão.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(INITIATIVE_TYPE_LABELS).map(([type, label]) => (
            <FormField key={type} label={label} htmlFor={`roi-cfg-iso-${type}`}>
              <Input
                id={`roi-cfg-iso-${type}`}
                type="number"
                min={0}
                max={1}
                step={0.05}
                placeholder="—"
                value={form.defaultIsolationFactors[type] ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultIsolationFactors: {
                      ...form.defaultIsolationFactors,
                      ...(e.target.value ? { [type]: Number(e.target.value) } : {}),
                      ...(e.target.value
                        ? {}
                        : Object.fromEntries(
                            Object.entries(form.defaultIsolationFactors).filter(
                              ([k]) => k !== type,
                            ),
                          )),
                    },
                  })
                }
                className="w-full"
              />
            </FormField>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-3">
          Medição &amp; obrigatoriedade de Nível 4/5
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Períodos de medição pós-iniciativa (dias, separados por vírgula)"
            htmlFor="roi-cfg-periods"
          >
            <Input
              id="roi-cfg-periods"
              value={periodsText}
              onChange={(e) => setPeriodsText(e.target.value)}
              placeholder="30, 60, 90, 180"
              className="w-full"
            />
          </FormField>
          <FormField
            label="Limiar de custo que obriga medição de Nível 4/5"
            htmlFor="roi-cfg-threshold"
          >
            <Input
              id="roi-cfg-threshold"
              type="number"
              min={0}
              placeholder="Sem limiar"
              value={form.level45CostThreshold ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  level45CostThreshold: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full"
            />
          </FormField>
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-3">
          Responsáveis pela validação de benefícios
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.defaultBenefitValidatorIds.map((id) => (
            <ValidatorChip
              key={id}
              id={id}
              onRemove={() =>
                setForm({
                  ...form,
                  defaultBenefitValidatorIds: form.defaultBenefitValidatorIds.filter(
                    (v) => v !== id,
                  ),
                })
              }
            />
          ))}
        </div>
        <DepartmentUserPicker
          label="Adicionar responsável"
          htmlFor="roi-cfg-add-validator"
          value={null}
          onChange={addValidator}
        />
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-1">
          Fórmulas de conversão de benefícios não financeiros
        </div>
        <p className="font-body text-xs text-ink-faint mb-3">
          Como converter cada tipo de benefício em valor monetário — texto livre usado como guia
          na Etapa 3 do assistente &quot;Nova Análise de ROI&quot;.
        </p>
        <div className="space-y-2">
          {Object.entries(BENEFIT_TYPE_LABELS).map(([type, label]) => (
            <FormField key={type} label={label} htmlFor={`roi-cfg-formula-${type}`}>
              <Input
                id={`roi-cfg-formula-${type}`}
                placeholder="ex.: output/hora × salário/hora"
                value={form.benefitConversionFormulas[type] ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    benefitConversionFormulas: {
                      ...form.benefitConversionFormulas,
                      ...(e.target.value
                        ? { [type]: e.target.value }
                        : Object.fromEntries(
                            Object.entries(form.benefitConversionFormulas).filter(
                              ([k]) => k !== type,
                            ),
                          )),
                    },
                  })
                }
                className="w-full"
              />
            </FormField>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-1">Permissões de acesso</div>
        <p className="font-body text-xs text-ink-faint mb-3">
          Quem vê o ROI financeiro (valores monetários/%) vs. quem vê apenas os indicadores
          operacionais.
        </p>
        <div className="space-y-3">
          <div>
            <div className="font-body text-xs text-ink-muted mb-1">Vê o ROI financeiro</div>
            <RoleCheckboxGroup
              selected={form.financialAccessRoles}
              onChange={(roles) => setForm({ ...form, financialAccessRoles: roles })}
            />
          </div>
          <div>
            <div className="font-body text-xs text-ink-muted mb-1">Vê apenas indicadores operacionais</div>
            <RoleCheckboxGroup
              selected={form.operationalOnlyRoles}
              onChange={(roles) => setForm({ ...form, operationalOnlyRoles: roles })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-3">
          Alertas &amp; notificações
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Iniciativa sem medição há X dias" htmlFor="roi-cfg-alert-days">
            <Input
              id="roi-cfg-alert-days"
              type="number"
              min={1}
              placeholder="Desactivado"
              value={form.alertNoMeasurementDays ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  alertNoMeasurementDays: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full"
            />
          </FormField>
          <FormField label="ROI abaixo do esperado (%)" htmlFor="roi-cfg-alert-roi">
            <Input
              id="roi-cfg-alert-roi"
              type="number"
              placeholder="Desactivado"
              value={form.alertRoiBelowExpectedPercent ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  alertRoiBelowExpectedPercent: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full"
            />
          </FormField>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saveMutation.isPending}>
          Guardar configurações
        </Button>
      </div>
    </div>
  );
}
