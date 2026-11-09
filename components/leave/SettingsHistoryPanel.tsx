// components/leave/SettingsHistoryPanel.tsx
// Histórico de alterações às Configurações (docs/Modulo_Leave.md §10): cada
// gravação é uma versão imutável com data de entrada em vigor, autor, motivo
// e as definições que mudaram.

'use client';

import { History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSettingsHistory } from '@/hooks/useLeave';
import { SectionHeader } from './SettingsFields';
import { SETTING_LABELS } from './settingsMeta';
import { formatDateNumeric, formatDateTimeShort } from '@/lib/format';

export function SettingsHistoryPanel() {
  const { data, loading } = useSettingsHistory(true);

  if (loading) return <Skeleton rows={4} />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem alterações registadas"
        description="Está a ser usada a configuração por omissão. As alterações que gravar ficam aqui."
      />
    );
  }

  return (
    <ol className="space-y-3">
      {data.map((h) => (
        <li key={h.id}>
          <Card className="overflow-hidden p-0">
            <SectionHeader
              icon={History}
              title={h.changeNote || 'Sem motivo indicado'}
              actions={
                <span
                  className={
                    h.scheduled
                      ? 'rounded-control bg-warning-subtle px-2 py-0.5 text-xs font-semibold text-warning-ink'
                      : 'rounded-control bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success-ink'
                  }
                >
                  {h.scheduled
                    ? `Agendada para ${formatDateNumeric(h.effectiveFrom)}`
                    : `Em vigor desde ${formatDateNumeric(h.effectiveFrom)}`}
                </span>
              }
            />
            <div className="p-4">
              <p className="text-xs text-ink-faint">
                {h.createdByName ?? `Utilizador #${h.createdById}`} ·{' '}
                {formatDateTimeShort(h.createdAt)}
              </p>
              {h.changedKeys.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {h.changedKeys.map((k) => (
                    <span
                      key={k}
                      className="rounded-control bg-surface-sunken px-2 py-0.5 text-xs text-ink-muted"
                    >
                      {SETTING_LABELS[k] ?? k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}
