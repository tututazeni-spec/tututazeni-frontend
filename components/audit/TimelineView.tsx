// components/audit/TimelineView.tsx
// Vista "Timeline": histórico de eventos de um recurso específico
// (entidade + ID). Extraído de app/(platform)/audit/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
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
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="Entidade (ex: PDI, User, Course)"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="ID"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={load}
          disabled={loading || !entity || !entityId}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? '…' : 'Ver timeline'}
        </button>
      </div>

      {data && (
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-4">
            Timeline: {data.entity} #{data.entityId} — {data.events.length}{' '}
            eventos
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3 pl-10">
              {data.events.map((e) => {
                const sevCfg =
                  SEVERITY_CFG[e.severity as Severity] ?? SEVERITY_CFG.LOW;
                return (
                  <div key={e.id} className="relative">
                    <div
                      className={`absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-white ${sevCfg.dot}`}
                    />
                    <div
                      className={`bg-white border rounded-xl p-3 ${e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'border-red-200' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {ACTION_ICONS[e.action] ?? '📋'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {e.action}
                          </span>
                          <span className={`text-xs font-medium ${sevCfg.cls}`}>
                            {e.severity}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {fmtTs(e.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
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

      {!data && !loading && (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Introduz uma entidade e ID para ver a timeline completa
        </div>
      )}
    </div>
  );
}
