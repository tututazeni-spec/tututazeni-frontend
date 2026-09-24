// components/onboarding/IntegrationPlansTab.tsx
// Separador "Planos de Integração" (docs/onboarding.md ponto 3) — catálogo
// de templates de onboarding ("Onboarding Administrativo", "Onboarding
// Lojas", etc.). Sucessor de TemplatesView.tsx (Fase A do remodelo):
// acrescenta Objectivo/Unidade/Versão, que o backend já devolve.
//
// O clique num cartão abre o TemplateDetailModal (leitura aberta a todos);
// é lá que ADMIN/RH gere as tarefas de cada fase — daí a prop `canManage`,
// que vem já resolvida do page.tsx (ADMIN_ROLES).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CFG } from './constants';
import { TemplateDetailModal } from './TemplateDetailModal';
import type { OnboardingTemplate } from './types';

export interface IntegrationPlansTabProps {
  /** ADMIN/RH: activa a gestão de tarefas no detalhe do template. */
  canManage?: boolean;
}

export function IntegrationPlansTab({ canManage = false }: IntegrationPlansTabProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data = [], isLoading: loading } = useApiQuery<OnboardingTemplate[]>(
    queryKeys.onboarding.templates(),
    '/onboarding/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-3 gap-4"
        itemClassName="h-40 bg-surface-sunken rounded-card animate-pulse"
      />
    );

  if (data.length === 0) {
    return <EmptyState title="Sem planos de integração" description="Sem planos de integração configurados" />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((t) => (
        <Card key={t.id} interactive onClick={() => setDetailId(t.id)} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-ink">
                {t.name}
                {t.version && t.version > 1 && (
                  <span className="ml-1.5 font-mono text-xs font-normal text-ink-faint">v{t.version}</span>
                )}
              </div>
              {t.objective ? (
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{t.objective}</p>
              ) : (
                t.description && (
                  <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{t.description}</p>
                )
              )}
            </div>
            <Badge intent={t.active ? 'success' : 'neutral'}>{t.active ? 'Activo' : 'Inactivo'}</Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-ink-faint mb-4">
            <span> {t.durationDays} dias</span>
            <span> {t._count?.tasks ?? 0} tarefas</span>
            <span> {t._count?.plans ?? 0} planos</span>
            {t.position && <span> {t.position.name}</span>}
            {t.department && <span> {t.department.name}</span>}
            {t.unit && <span> {t.unit.name}</span>}
          </div>

          {t.tasks && t.tasks.length > 0 && (
            <div className="space-y-1">
              {t.tasks.slice(0, 3).map((task) => {
                const catCfg = CATEGORY_CFG[task.category];
                const CatIcon = catCfg?.icon;
                return (
                  <div key={task.id} className="flex items-center gap-2 text-xs text-ink-muted">
                    <span>{CatIcon ? <CatIcon size={13} strokeWidth={1.75} /> : '•'}</span>
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-warning-ink">+{task.xpReward}xp</span>
                  </div>
                );
              })}
              {t.tasks.length > 3 && (
                <div className="text-xs text-ink-faint">+{t.tasks.length - 3} mais tarefas…</div>
              )}
            </div>
          )}
        </Card>
      ))}

      {detailId !== null && (
        <TemplateDetailModal templateId={detailId} canManage={canManage} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
