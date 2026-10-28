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

import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  Calculator,
  Coins,
  Filter,
  Ruler,
  ShieldCheck,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { AUTHENTICATED_ROLES, type Role } from '@/lib/roles';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { INITIATIVE_TYPE_LABELS, BENEFIT_TYPE_LABELS } from './utils';
import type { RoiConfigData } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

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

// Uma cor por perfil (as mesmas do Audit): contorno identifica, preenchimento marca activo.
const ROLE_COLORS: Record<Role, string> = {
  ADMIN: '#E5484D',
  RH: '#8E4EC6',
  GESTOR: '#E99A16',
  DIRECTOR: '#3E8EF7',
  LIDER: '#12A594',
  COLABORADOR: '#30A46C',
  INSTRUCTOR: '#D6409F',
  AUDITOR: '#6E56CF',
};

interface ConfigCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Card claro das Configurações (mesmo desenho da lista de sessões dos eventos), com faixa de título azul-marinho. */
function ConfigCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: ConfigCardProps) {
  return (
    <Card
      className={`flex flex-col overflow-hidden rounded-[24px] border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)] ${className ?? ''}`}
    >
      <div className="pointer-events-none flex cursor-default select-none items-center gap-3 bg-brand/60 px-5 py-4 text-white">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {subtitle && (
            <p className="font-body text-xs text-white/85">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex-1 px-6 py-6">{children}</div>
    </Card>
  );
}

function RoleCheckboxGroup({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  const toggle = (role: Role) => {
    onChange(
      selected.includes(role)
        ? selected.filter((r) => r !== role)
        : [...selected, role],
    );
  };
  return (
    <div className="flex flex-wrap gap-2">
      {AUTHENTICATED_ROLES.map((role) => {
        const on = selected.includes(role);
        return (
          <label
            key={role}
            style={{
              borderColor: ROLE_COLORS[role],
              backgroundColor: on
                ? ROLE_COLORS[role]
                : `${ROLE_COLORS[role]}1A`,
              color: on ? '#fff' : 'var(--color-brand-ink)',
            }}
            className="flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:brightness-95 focus-within:ring-2 focus-within:ring-brand/40"
          >
            <Checkbox checked={on} onChange={() => toggle(role)} />
            {ROLE_LABELS[role]}
          </label>
        );
      })}
    </div>
  );
}

function ValidatorChip({ id, onRemove }: { id: number; onRemove: () => void }) {
  const { data: user } = useApiQuery<DirectoryUser>(
    queryKeys.users.detail(id),
    `/users/${id}`,
    {
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
  return (
    <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
      <Avatar
        name={user?.fullName ?? `#${id}`}
        url={user?.avatarUrl ?? undefined}
        size="sm"
      />
      <span className="text-sm text-ink">
        {user?.fullName ?? `Utilizador #${id}`}
      </span>
      <IconButton
        icon={X}
        label="Remover responsável"
        intent="ghost"
        size="xs"
        type="button"
        onClick={onRemove}
      />
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
      onSuccess: () =>
        notify({ title: 'Configurações guardadas', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const addValidator = (u: DirectoryUser | null) => {
    if (!u || !form || form.defaultBenefitValidatorIds.includes(u.id)) return;
    setForm({
      ...form,
      defaultBenefitValidatorIds: [...form.defaultBenefitValidatorIds, u.id],
    });
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
    <div className="max-w-6xl space-y-8">
      <section aria-label="Metodologia de cálculo" className="space-y-3">
        <div className="pointer-events-none cursor-default select-none rounded-card bg-brand/60 px-5 py-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Metodologia de cálculo
          </h3>
          <p className="font-body text-xs text-white">
            Valores por omissão que o assistente «Nova Análise de ROI» usa em
            cada análise.
          </p>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <ConfigCard
            className="h-full"
            icon={Coins}
            title="Moeda &amp; custo de capital"
            subtitle="Moeda usada nas análises e taxa de desconto aplicada aos benefícios futuros."
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField label="Moeda" htmlFor="roi-cfg-currency">
                <Input
                  id="roi-cfg-currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  className="w-full"
                />
              </FormField>
              <FormField
                label="Taxa de desconto / custo de capital (%)"
                htmlFor="roi-cfg-discount"
              >
                <Input
                  id="roi-cfg-discount"
                  type="number"
                  step={0.1}
                  placeholder="Não aplicável"
                  value={form.discountRatePercent ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountRatePercent: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full"
                />
              </FormField>
            </div>
          </ConfigCard>

          <ConfigCard
            className="h-full"
            icon={Ruler}
            title="Medição &amp; obrigatoriedade de Nível 4/5"
            subtitle="Quando medir os resultados depois da iniciativa e a partir de que custo a medição passa a ser obrigatória."
          >
            <div className="grid grid-cols-1 gap-4">
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
                      level45CostThreshold: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full"
                />
              </FormField>
            </div>
          </ConfigCard>
        </div>

        <ConfigCard
          icon={Filter}
          title="Fator de isolamento padrão por tipo de iniciativa"
          subtitle='Pré-preenche a Etapa 4 (Metodologia) do assistente "Nova Análise de ROI" — quanto do resultado é atribuível à iniciativa (0–1), por omissão.'
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(INITIATIVE_TYPE_LABELS).map(([type, label]) => (
              <FormField
                key={type}
                label={label}
                htmlFor={`roi-cfg-iso-${type}`}
              >
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
                        ...(e.target.value
                          ? { [type]: Number(e.target.value) }
                          : {}),
                        ...(e.target.value
                          ? {}
                          : Object.fromEntries(
                              Object.entries(
                                form.defaultIsolationFactors,
                              ).filter(([k]) => k !== type),
                            )),
                      },
                    })
                  }
                  className="w-full"
                />
              </FormField>
            ))}
          </div>
        </ConfigCard>

        <ConfigCard
          icon={Calculator}
          title="Fórmulas de conversão de benefícios não financeiros"
          subtitle='Como converter cada tipo de benefício em valor monetário — texto livre usado como guia na Etapa 3 do assistente "Nova Análise de ROI".'
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Object.entries(BENEFIT_TYPE_LABELS).map(([type, label]) => (
              <FormField
                key={type}
                label={label}
                htmlFor={`roi-cfg-formula-${type}`}
              >
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
                              Object.entries(
                                form.benefitConversionFormulas,
                              ).filter(([k]) => k !== type),
                            )),
                      },
                    })
                  }
                  className="w-full"
                />
              </FormField>
            ))}
          </div>
        </ConfigCard>
      </section>

      <section aria-label="Validação e avisos" className="space-y-3">
        <div className="pointer-events-none cursor-default select-none rounded-card bg-brand/60 px-5 py-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Validação e avisos
          </h3>
          <p className="font-body text-xs text-white">
            Quem confirma os benefícios e quando o sistema avisa o RH.
          </p>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <ConfigCard
            className="h-full"
            icon={UserCheck}
            title="Responsáveis pela validação de benefícios"
            subtitle="Pessoas que confirmam os benefícios declarados numa análise de ROI."
          >
            <div className="mb-3 flex flex-wrap gap-2">
              {form.defaultBenefitValidatorIds.map((id) => (
                <ValidatorChip
                  key={id}
                  id={id}
                  onRemove={() =>
                    setForm({
                      ...form,
                      defaultBenefitValidatorIds:
                        form.defaultBenefitValidatorIds.filter((v) => v !== id),
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
          </ConfigCard>

          <ConfigCard
            className="h-full"
            icon={Bell}
            title="Alertas &amp; notificações"
            subtitle="Avisos automáticos quando uma iniciativa fica sem medição ou o ROI fica abaixo do esperado."
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField
                label="Iniciativa sem medição há X dias"
                htmlFor="roi-cfg-alert-days"
              >
                <Input
                  id="roi-cfg-alert-days"
                  type="number"
                  min={1}
                  placeholder="Desactivado"
                  value={form.alertNoMeasurementDays ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      alertNoMeasurementDays: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full"
                />
              </FormField>
              <FormField
                label="ROI abaixo do esperado (%)"
                htmlFor="roi-cfg-alert-roi"
              >
                <Input
                  id="roi-cfg-alert-roi"
                  type="number"
                  placeholder="Desactivado"
                  value={form.alertRoiBelowExpectedPercent ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      alertRoiBelowExpectedPercent: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full"
                />
              </FormField>
            </div>
          </ConfigCard>
        </div>
      </section>

      <section aria-label="Acesso" className="space-y-3">
        <div className="pointer-events-none cursor-default select-none rounded-card bg-brand/60 px-5 py-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Acesso
          </h3>
          <p className="font-body text-xs text-white">
            Define quem vê os valores financeiros do módulo.
          </p>
        </div>
        <ConfigCard
          icon={ShieldCheck}
          title="Permissões de acesso"
          subtitle="Quem vê o ROI financeiro (valores monetários/%) vs. quem vê apenas os indicadores operacionais."
        >
          <div className="grid gap-5 md:grid-cols-2 md:gap-0 md:divide-x md:divide-brand-line">
            <div className="md:pr-6">
              <div className="mb-2 font-body text-xs font-medium text-brand-muted">
                Vê o ROI financeiro
              </div>
              <RoleCheckboxGroup
                selected={form.financialAccessRoles}
                onChange={(roles) =>
                  setForm({ ...form, financialAccessRoles: roles })
                }
              />
            </div>
            <div className="md:pl-6">
              <div className="mb-2 font-body text-xs font-medium text-brand-muted">
                Vê apenas indicadores operacionais
              </div>
              <RoleCheckboxGroup
                selected={form.operationalOnlyRoles}
                onChange={(roles) =>
                  setForm({ ...form, operationalOnlyRoles: roles })
                }
              />
            </div>
          </div>
        </ConfigCard>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-brand-line bg-surface px-6 py-4 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <p className="font-body text-xs text-brand-muted">
          As alterações só se aplicam depois de guardar.
        </p>
        <Button onClick={handleSave} loading={saveMutation.isPending}>
          Guardar configurações
        </Button>
      </div>
    </div>
  );
}
