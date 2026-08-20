// components/audit/TimelineView.tsx
// Vista "Timeline": histórico de eventos de um recurso específico
// (entidade + ID). Extraído de app/(platform)/audit/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { SEVERITY_CFG, ACTION_ICONS } from './constants';
import { fmtTs } from './utils';
import { DiffViewer } from './DiffViewer';
import type { Severity, Timeline } from './types';

export function TimelineView() {
  const [entity, setEntity] = useState('');
  const [entityId, setEntityId] = useState('');

  const loadTimeline = useApiMutation(
    ({ entity, entityId }: { entity: string; entityId: string }) =>
      apiClient.get<Timeline>(`/audit/timeline/${entity}/${entityId}`),
  );
  const data = loadTimeline.data ?? null;
  const loading = loadTimeline.isPending;

  const load = () => {
    if (!entity.trim() || !entityId.trim()) return;
    loadTimeline.mutate({ entity, entityId });
  };

  return (
    <div>
      <div className="mb-5 flex gap-2">
        <Input
          type="text"
          placeholder="Entidade (ex: PDI, User, Course)"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="flex-1"
        />
        <Input
          type="number"
          placeholder="ID"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="w-24"
        />
        <Button onClick={load} disabled={loading || !entity || !entityId}>
          {loading ? '…' : 'Ver timeline'}
        </Button>
      </div>

      {data && (
        <div>
          <div className="mb-4 font-body text-sm font-semibold text-ink">
            Timeline: {data.entity} #{data.entityId} — {data.events.length}{' '}
            eventos
          </div>
          <div className="relative">
            <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-border" />
            <div className="space-y-3 pl-10">
              {data.events.map((e) => {
                const sevCfg =
                  SEVERITY_CFG[e.severity as Severity] ?? SEVERITY_CFG.LOW;
                return (
                  <div key={e.id} className="relative">
                    <div
                      className={`absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-surface ${sevCfg.dot}`}
                    />
                    <div
                      className={`rounded-card border bg-surface p-3 ${e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'border-danger' : 'border-border'}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {ACTION_ICONS[e.action] ?? '📋'}
                          </span>
                          <span className="font-body text-sm font-medium text-ink">
                            {e.action}
                          </span>
                          <span
                            className={`font-body text-xs font-medium ${sevCfg.cls}`}
                          >
                            {e.severity}
                          </span>
                        </div>
                        <span className="font-body text-xs text-ink-faint">
                          {fmtTs(e.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-body text-xs text-ink-muted">
                        {e.user && <span>por {e.user.fullName}</span>}
                        {e.ip && <span>· IP: {e.ip}</span>}
                        {e.reason && <span>· &quot;{e.reason}&quot;</span>}
                      </div>
                      {e.changes && <DiffViewer changes={e.changes} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loadTimeline.isError && (
        <QueryError error={loadTimeline.error} onRetry={load} />
      )}

      {!data && !loading && !loadTimeline.isError && (
        <div className="rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
          Introduz uma entidade e ID para ver a timeline completa
        </div>
      )}
    </div>
  );
}
