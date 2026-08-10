// components/audit/AnomaliesView.tsx
// Vista "Anomalias": detecção de padrões suspeitos e verificação da
// hash chain de integridade. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { Anomalies, IntegrityCheck } from './types';

export function AnomaliesView() {
  const dataQ = useApiQuery<Anomalies>(
    queryKeys.audit.anomalies(),
    '/audit/anomalies',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const integrityQ = useApiQuery<IntegrityCheck>(
    queryKeys.audit.integrity(),
    '/audit/integrity/verify',
    { params: { limit: 200 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const data = dataQ.data ?? null;
  const integrity = integrityQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div
        className={`flex items-center gap-3 p-4 border rounded-xl ${data.totalAlerts > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
      >
        <span className="text-3xl">{data.totalAlerts > 0 ? '🚨' : '✅'}</span>
        <div>
          <div
            className={`text-sm font-semibold ${data.totalAlerts > 0 ? 'text-red-700' : 'text-emerald-700'}`}
          >
            {data.totalAlerts > 0
              ? `${data.totalAlerts} anomalia(s) detectada(s)`
              : 'Nenhuma anomalia detectada'}
          </div>
          <div className="text-xs text-gray-500">
            Última verificação: agora mesmo
          </div>
        </div>
      </div>

      {/* Integridade */}
      {integrity && (
        <div
          className={`flex items-center gap-3 p-4 border rounded-xl ${integrity.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
        >
          <span className="text-2xl">{integrity.valid ? '🔒' : '⚠️'}</span>
          <div>
            <div
              className={`text-sm font-semibold ${integrity.valid ? 'text-emerald-700' : 'text-red-700'}`}
            >
              {integrity.valid
                ? `Hash chain íntegra (${integrity.checked} registos verificados)`
                : `⚠️ ${integrity.broken.length} registo(s) com hash inválida`}
            </div>
            {!integrity.valid && (
              <div className="text-xs text-red-600 mt-0.5">
                IDs afectados: {integrity.broken.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anomalias por tipo */}
      {[
        {
          label: '🔑 Logins suspeitos (>3 falhas/hora)',
          items: data.suspiciousLogins,
          color: 'text-red-700',
        },
        {
          label: '📥 Exportações em massa (>3/hora)',
          items: data.massExports,
          color: 'text-amber-700',
        },
        {
          label: '🗑️ Deleções em massa (>5/dia)',
          items: data.massDeletes,
          color: 'text-red-700',
        },
      ].map(({ label, items, color }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className={`text-sm font-semibold mb-3 ${color}`}>{label}</div>
          {items.length === 0 ? (
            <div className="text-xs text-gray-400">
              Nenhuma anomalia deste tipo
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-xs text-gray-700">
                    User ID: {item.userId}
                  </span>
                  <span className={`text-xs font-bold font-mono ${color}`}>
                    {item.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
