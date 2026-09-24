// components/onboarding/StagesTab.tsx
// Separador "Etapas" (docs/onboarding.md ponto 4) — tarefas de um Plano de
// Integração agrupadas por fase, com duração/responsável/critérios de
// conclusão derivados (não há um modelo "Etapa" próprio — ver decisão 1
// do plano de remodelo). Escolhe-se o plano de integração (template) no
// topo; sem @Roles() próprio (como "Planos de Integração", de que depende).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CFG, PHASE_LABELS, RESPONSIBLE_LABELS } from './constants';
import { useTemplateOptions } from './planData';
import type { OnboardingStageGroup } from './types';

export function StagesTab() {
  const { options: templateOptions, loading: loadingTemplates } = useTemplateOptions();
  const [templateId, setTemplateId] = useState<string>('');

  const effectiveId = templateId || templateOptions[0]?.value || '';

  const { data: stages, isLoading } = useApiQuery<OnboardingStageGroup[]>(
    queryKeys.onboarding.stages(Number(effectiveId)),
    `/onboarding/templates/${effectiveId}/stages`,
    { staleTime: STALE_TIME.SEMI_STATIC, enabled: !!effectiveId },
  );

  if (loadingTemplates) return <Skeleton rows={3} />;

  if (templateOptions.length === 0) {
    return (
      <EmptyState
        title="Sem planos de integração"
        description="Cria um plano de integração em 'Planos de Integração' para veres as suas etapas."
      />
    );
  }

  return (
    <div>
      <div className="mb-5">
        <Select
          items={templateOptions}
          value={effectiveId}
          onValueChange={setTemplateId}
        />
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : !stages || stages.length === 0 ? (
        <EmptyState title="Sem etapas" description="Este plano ainda não tem tarefas atribuídas a fases." />
      ) : (
        <div className="space-y-3">
          {stages.map((s) => (
            <div key={s.phase} className="rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-body text-sm font-semibold text-ink">{PHASE_LABELS[s.phase]}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-ink-faint">
                  <span>{s.taskCount} tarefas ({s.mandatoryCount} obrigatórias)</span>
                  {s.minDayOffset != null && s.maxDayOffset != null && (
                    <span>
                      Prazo: dia {s.minDayOffset}
                      {s.maxDayOffset !== s.minDayOffset ? ` – ${s.maxDayOffset}` : ''}
                    </span>
                  )}
                  {s.responsible && <span>Responsável: {RESPONSIBLE_LABELS[s.responsible]}</span>}
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {s.tasks.map((t) => {
                  const catCfg = CATEGORY_CFG[t.category];
                  const CatIcon = catCfg?.icon;
                  return (
                    <li key={t.id} className="flex items-center gap-2 font-body text-xs text-ink-muted">
                      <span>{CatIcon ? <CatIcon size={13} strokeWidth={1.75} /> : '•'}</span>
                      <span className="truncate">{t.title}</span>
                      {!t.isMandatory && <span className="text-ink-faint">(opcional)</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
