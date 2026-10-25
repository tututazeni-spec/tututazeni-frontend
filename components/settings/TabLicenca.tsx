// components/settings/TabLicenca.tsx
// Tab "Licença e Módulos" (ADMIN): plano/utilizadores/validade (geridos em
// Escalabilidade > Inquilinos — aqui só consulta) + módulos activos/inactivos
// (feature flags) — GET /settings/license, PUT /settings/license/modules
// (docs/modulo_settings.md §9).

'use client';

import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useServerDraft } from '@/hooks/useServerDraft';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { LicenseSettings } from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';

const MODULE_LABELS: Record<string, string> = {
  DASHBOARD: 'Dashboard',
  REPORTS: 'Relatórios',
  USERS: 'Utilizadores',
  ROLES: 'Perfis e permissões',
  LMS: 'Academia / Cursos',
  PERFORMANCE: 'Avaliação de desempenho',
  ENGAGEMENT: 'Engajamento',
  TALENT: 'Talento / Carreira',
  EVALUATION: 'Avaliação 360°',
  CONTENT_LIBRARY: 'Biblioteca de conteúdos',
  AVATAR_TRAINING: 'Formação com avatar',
  ROI_IMPACT: 'ROI e impacto',
  HISTORY: 'Histórico',
  PAYROLL: 'Processamento salarial',
  SENSITIVE_DATA: 'Dados sensíveis',
  ACL: 'Controlo de acessos',
  HR: 'RH',
};

const TRIAL_LABELS: Record<
  string,
  { label: string; intent: 'neutral' | 'success' | 'danger' }
> = {
  NONE: { label: 'Sem trial', intent: 'neutral' },
  ACTIVE: { label: 'Trial activo', intent: 'success' },
  EXPIRED: { label: 'Trial expirado', intent: 'danger' },
};

// Cores de estado do card ROI Total (verde / vermelho / cinzento).
const TRIAL_COLORS = {
  neutral: '#9CA3AF',
  success: '#34D399',
  danger: '#F87171',
};

export function TabLicenca() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<LicenseSettings>(
    queryKeys.settings.license(),
    '/settings/license',
  );

  const [modules, setModules] = useServerDraft<Record<string, boolean>>(
    data?.modules,
  );

  const save = useApiMutation(
    (payload: Record<string, boolean>) =>
      apiClient.put('/settings/license/modules', { modules: payload }),
    {
      invalidateKeys: [queryKeys.settings.license()],
      onSuccess: () =>
        toast({ title: 'Módulos actualizados', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !data || !modules) return <Skeleton rows={4} />;
  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );

  const trial = TRIAL_LABELS[data.trialStatus] ?? TRIAL_LABELS.NONE;

  return (
    <div className="space-y-4">
      {/* Mesmas cores do card "ROI Total" (roi-impact/RoiTotalCard) */}
      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand-mid to-brand-dark p-5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
            Plano actual
          </h3>
          <p className="m-0 text-xs text-white/70">
            Plano, utilizadores e validade geridos em Escalabilidade {'>'}{' '}
            Inquilinos.
          </p>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-white/70">
              Plano
            </p>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {data.plan}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-white/70">
              Estado
            </p>
            <span
              className="mt-1 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
              style={{ color: data.isActive ? '#34D399' : '#F87171' }}
            >
              {data.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-white/70">
              Utilizadores
            </p>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {data.currentUsers} / {data.maxUsers}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-white/70">
              Trial
            </p>
            <span
              className="mt-1 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
              style={{ color: TRIAL_COLORS[trial.intent] }}
            >
              {trial.label}
              {data.trialEndsAt &&
                ` · ${new Date(data.trialEndsAt).toLocaleDateString('pt-PT')}`}
            </span>
          </div>
          <div>
            <p className="m-0 text-xs uppercase tracking-wider text-white/70">
              Contrato
            </p>
            <p className="mt-1 text-sm text-white">
              {data.contractStartDate
                ? new Date(data.contractStartDate).toLocaleDateString('pt-PT')
                : '—'}
              {' → '}
              {data.contractEndDate
                ? new Date(data.contractEndDate).toLocaleDateString('pt-PT')
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Módulos activos
        </div>
        <CardBody>
          <p className="mb-4 text-xs text-ink-faint">
            Desactivar um módulo só regista a preferência — ainda não bloqueia
            as suas rotas.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {data.moduleOptions.map((key) => (
              <label
                key={key}
                htmlFor={`mod-${key}`}
                className="flex items-center gap-2 text-sm text-ink"
              >
                <Checkbox
                  id={`mod-${key}`}

                  checked={modules[key] ?? true}
                  onChange={(e) =>
                    setModules((m) =>
                      m ? { ...m, [key]: e.target.checked } : m,
                    )
                  }
                />
                {MODULE_LABELS[key] ?? key}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              disabled={save.isPending}
              onClick={() => save.mutate(modules)}
            >
              {save.isPending ? 'A guardar…' : 'Guardar módulos'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
