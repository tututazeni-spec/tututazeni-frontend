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
import { SETTING_LABELS } from './settingsMeta';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('pt-PT');
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });

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
          <Card className="overflow-hidden p-4">
            <div className="-mx-4 -mt-4 mb-3 flex flex-wrap items-center justify-between gap-2 bg-[#0F1F3D]/60 px-4 py-3">
              <p className="text-sm font-semibold text-white">
                {h.changeNote || 'Sem motivo indicado'}
              </p>
              <span
                className={
                  h.scheduled
                    ? 'rounded-control bg-warning-subtle px-2 py-0.5 text-xs font-semibold text-warning-ink'
                    : 'rounded-control bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success-ink'
                }
              >
                {h.scheduled
                  ? `Agendada para ${fmt(h.effectiveFrom)}`
                  : `Em vigor desde ${fmt(h.effectiveFrom)}`}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {h.createdByName ?? `Utilizador #${h.createdById}`} ·{' '}
              {fmtTime(h.createdAt)}
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
          </Card>
        </li>
      ))}
    </ol>
  );
}
