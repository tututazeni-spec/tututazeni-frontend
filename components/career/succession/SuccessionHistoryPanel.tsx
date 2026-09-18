// components/career/succession/SuccessionHistoryPanel.tsx
// Secção 7, item "histórico de sucessão" — auditoria de mudanças ao cargo
// crítico e aos seus planos de sucessão (GET
// /succession/critical-positions/:id/history). Renderizado dentro do
// detalhe do cargo crítico em CriticalPositionsView.

'use client';

import { History } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SuccessionHistoryEntry } from './types';

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Criado',
  UPDATE: 'Actualizado',
  DELETE: 'Removido',
};

const ENTITY_LABEL: Record<string, string> = {
  CriticalPosition: 'Cargo crítico',
  SuccessionPlan: 'Sucessor',
};

function describeMetadata(entry: SuccessionHistoryEntry): string | null {
  const m = entry.metadata;
  if (!m) return null;
  if (entry.entity === 'CriticalPosition' && entry.action === 'UPDATE' && m.exitRiskBefore) {
    return `Risco: ${m.exitRiskBefore} → ${m.exitRiskAfter}`;
  }
  if (entry.entity === 'CriticalPosition' && entry.action === 'CREATE' && m.exitRisk) {
    return `Impacto: ${m.businessImpact} · Risco inicial: ${m.exitRisk}`;
  }
  if (entry.entity === 'SuccessionPlan' && entry.action === 'CREATE' && m.candidate) {
    return `${m.candidate} adicionado (${m.readinessLevel}, ${m.priority})`;
  }
  if (entry.entity === 'SuccessionPlan' && entry.action === 'UPDATE' && m.readinessLevelBefore) {
    return `Prontidão: ${m.readinessLevelBefore} → ${m.readinessLevelAfter}`;
  }
  if (entry.entity === 'SuccessionPlan' && entry.action === 'DELETE' && m.candidate) {
    return `${m.candidate} removido`;
  }
  return null;
}

export function SuccessionHistoryPanel({ criticalPositionId }: { criticalPositionId: number }) {
  const { data: history = [], isLoading } = useApiQuery<SuccessionHistoryEntry[]>(
    queryKeys.succession.criticalPositionHistory(criticalPositionId),
    `/succession/critical-positions/${criticalPositionId}/history`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={2} />;
  if (history.length === 0) {
    return (
      <p className="font-body text-xs text-ink-faint">Sem histórico registado para este cargo.</p>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((h) => {
        const detail = describeMetadata(h);
        return (
          <div key={h.id} className="flex items-start gap-2 font-body text-xs">
            <History size={13} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1">
              <span className="text-ink-muted">
                <span className="font-medium text-ink">{h.user?.fullName ?? 'Sistema'}</span>{' '}
                {ACTION_LABEL[h.action]?.toLowerCase() ?? h.action.toLowerCase()}{' '}
                {ENTITY_LABEL[h.entity] ?? h.entity}
              </span>
              {detail && <div className="text-ink-faint">{detail}</div>}
            </div>
            <span className="flex-shrink-0 text-ink-faint">
              {new Date(h.createdAt).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
