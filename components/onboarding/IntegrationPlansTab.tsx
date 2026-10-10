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
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TemplateCard } from './TemplateCard';
import { TemplateDetailModal } from './TemplateDetailModal';
import type { OnboardingTemplate } from './types';

export interface IntegrationPlansTabProps {
  /** ADMIN/RH: activa a gestão de tarefas no detalhe do template. */
  canManage?: boolean;
}

export function IntegrationPlansTab({
  canManage = false,
}: IntegrationPlansTabProps) {
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
    return (
      <EmptyState
        title="Sem planos de integração"
        description="Sem planos de integração configurados"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((t) => (
        <TemplateCard
          key={t.id}
          template={t}
          onOpen={() => setDetailId(t.id)}
        />
      ))}

      {detailId !== null && (
        <TemplateDetailModal
          templateId={detailId}
          canManage={canManage}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
