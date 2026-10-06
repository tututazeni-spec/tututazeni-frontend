// components/settings/TabLicenca.tsx
// Tab "Licença e Módulos" (ADMIN): plano/utilizadores/validade (geridos em
// Escalabilidade > Inquilinos — aqui só consulta) + módulos activos/inactivos
// (feature flags) — GET /settings/license, PUT /settings/license/modules
// (docs/modulo_settings.md §9).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { LicenseSettings } from './types';

const MODULE_LABELS: Record<string, string> = {
  DASHBOARD: 'Dashboard',
  REPORTS: 'Relatórios',
  USERS: 'Utilizadores',
  ROLES: 'Perfis e permissões',
  LMS: 'Academia / Cursos',
  PERFORMANCE: 'Avaliação de desempenho',
  ENGAGEMENT: 'Engagement',
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

const TRIAL_LABELS: Record<string, { label: string; intent: 'neutral' | 'success' | 'danger' }> = {
  NONE: { label: 'Sem trial', intent: 'neutral' },
  ACTIVE: { label: 'Trial activo', intent: 'success' },
  EXPIRED: { label: 'Trial expirado', intent: 'danger' },
};

export function TabLicenca() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<LicenseSettings>(
    queryKeys.settings.license(),
    '/settings/license',
  );

  const [modules, setModules] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    if (data) setModules(data.modules);
  }, [data]);

  const save = useApiMutation(
    (payload: Record<string, boolean>) => apiClient.put('/settings/license/modules', { modules: payload }),
    {
      invalidateKeys: [queryKeys.settings.license()],
      onSuccess: () => toast({ title: 'Módulos actualizados', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !data || !modules)
    return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

  const trial = TRIAL_LABELS[data.trialStatus] ?? TRIAL_LABELS.NONE;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Plano actual</h3>
            <p className="m-0 text-xs text-ink-faint">
              Plano, utilizadores e validade geridos em Escalabilidade {'>'} Inquilinos.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Plano</p>
              <p className="mt-1 text-lg font-bold text-ink">{data.plan}</p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Estado</p>
              <Badge intent={data.isActive ? 'success' : 'danger'} className="mt-1">
                {data.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Utilizadores</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {data.currentUsers} / {data.maxUsers}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Trial</p>
              <Badge intent={trial.intent} className="mt-1">
                {trial.label}
                {data.trialEndsAt && ` · ${new Date(data.trialEndsAt).toLocaleDateString('pt-PT')}`}
              </Badge>
            </div>
            <div>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Contrato</p>
              <p className="mt-1 text-sm text-ink">
                {data.contractStartDate ? new Date(data.contractStartDate).toLocaleDateString('pt-PT') : '—'}
                {' → '}
                {data.contractEndDate ? new Date(data.contractEndDate).toLocaleDateString('pt-PT') : '—'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-1 text-base font-bold text-ink">Módulos activos</h3>
          <p className="mb-4 text-xs text-ink-faint">
            Desactivar um módulo só regista a preferência — ainda não bloqueia as suas rotas.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {data.moduleOptions.map((key) => (
              <label key={key} htmlFor={`mod-${key}`} className="flex items-center gap-2 text-sm text-ink">
                <input
                  id={`mod-${key}`}
                  type="checkbox"
                  checked={modules[key] ?? true}
                  onChange={(e) => setModules((m) => (m ? { ...m, [key]: e.target.checked } : m))}
                />
                {MODULE_LABELS[key] ?? key}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button disabled={save.isPending} onClick={() => save.mutate(modules)}>
              {save.isPending ? 'A guardar…' : 'Guardar módulos'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
