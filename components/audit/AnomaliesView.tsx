// components/audit/AnomaliesView.tsx
// Vista "Anomalias": detecção de padrões suspeitos e verificação da
// hash chain de integridade. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Anomalies, IntegrityCheck } from './types';

const tone = (bad: boolean) =>
  `rounded-card p-4 transition-transform duration-200 hover:scale-[1.02] font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.35)] ${bad ? 'bg-danger/70' : 'bg-success/70'}`;

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
      <div className={`flex items-center gap-3 ${tone(data.totalAlerts > 0)}`}>
        <div>
          <div className="font-body text-sm font-bold">
            {data.totalAlerts > 0
              ? `${data.totalAlerts} anomalia(s) detectada(s)`
              : 'Nenhuma anomalia detectada'}
          </div>
          <div className="font-body text-xs font-medium">
            Última verificação: agora mesmo
          </div>
        </div>
      </div>

      {/* Integridade */}
      {integrity && (
        <div className={`flex items-center gap-3 ${tone(!integrity.valid)}`}>
          <div>
            <div className="font-body text-sm font-bold">
              {integrity.valid
                ? `Hash chain íntegra (${integrity.checked} registos verificados)`
                : `${integrity.broken.length} registo(s) com hash inválida`}
            </div>
            {!integrity.valid && (
              <div className="mt-0.5 font-body text-xs font-medium">
                IDs afectados: {integrity.broken.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anomalias por tipo */}
      {[
        {
          label: 'Logins suspeitos (>3 falhas/hora)',
          items: data.suspiciousLogins,
        },
        {
          label: 'Exportações em massa (>3/hora)',
          items: data.massExports,
        },
        {
          label: 'Eliminações em massa (>5/dia)',
          items: data.massDeletes,
        },
      ].map(({ label, items }) => (
        <div key={label} className={tone(items.length > 0)}>
          <div>
            <div className="mb-3 font-body text-sm font-bold">{label}</div>
            {items.length === 0 ? (
              <div className="font-body text-xs font-medium">
                Nenhuma anomalia deste tipo
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-white/30 py-2 last:border-0"
                  >
                    <span className="font-body text-xs font-medium">
                      User ID: {item.userId}
                    </span>
                    <span className="font-data text-xs font-bold">
                      {item.count}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
