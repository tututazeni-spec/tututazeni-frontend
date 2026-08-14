// components/audit/AnomaliesView.tsx
// Vista "Anomalias": detecção de padrões suspeitos e verificação da
// hash chain de integridade. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Anomalies, IntegrityCheck } from './types';

const ANOMALY_TONE = {
  danger: { text: 'text-danger-ink', count: 'text-danger-ink' },
  warning: { text: 'text-warning-ink', count: 'text-warning-ink' },
} as const;

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
        className={`flex items-center gap-3 rounded-card border p-4 ${data.totalAlerts > 0 ? 'border-danger bg-danger-subtle' : 'border-success bg-success-subtle'}`}
      >
        <span className="text-3xl">{data.totalAlerts > 0 ? '🚨' : '✅'}</span>
        <div>
          <div
            className={`font-body text-sm font-semibold ${data.totalAlerts > 0 ? 'text-danger-ink' : 'text-success-ink'}`}
          >
            {data.totalAlerts > 0
              ? `${data.totalAlerts} anomalia(s) detectada(s)`
              : 'Nenhuma anomalia detectada'}
          </div>
          <div className="font-body text-xs text-ink-muted">
            Última verificação: agora mesmo
          </div>
        </div>
      </div>

      {/* Integridade */}
      {integrity && (
        <div
          className={`flex items-center gap-3 rounded-card border p-4 ${integrity.valid ? 'border-success bg-success-subtle' : 'border-danger bg-danger-subtle'}`}
        >
          <span className="text-2xl">{integrity.valid ? '🔒' : '⚠️'}</span>
          <div>
            <div
              className={`font-body text-sm font-semibold ${integrity.valid ? 'text-success-ink' : 'text-danger-ink'}`}
            >
              {integrity.valid
                ? `Hash chain íntegra (${integrity.checked} registos verificados)`
                : `⚠️ ${integrity.broken.length} registo(s) com hash inválida`}
            </div>
            {!integrity.valid && (
              <div className="mt-0.5 font-body text-xs text-danger-ink">
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
          tone: ANOMALY_TONE.danger,
        },
        {
          label: '📥 Exportações em massa (>3/hora)',
          items: data.massExports,
          tone: ANOMALY_TONE.warning,
        },
        {
          label: '🗑️ Deleções em massa (>5/dia)',
          items: data.massDeletes,
          tone: ANOMALY_TONE.danger,
        },
      ].map(({ label, items, tone }) => (
        <Card key={label}>
          <CardBody>
            <div className={`mb-3 font-body text-sm font-semibold ${tone.text}`}>
              {label}
            </div>
            {items.length === 0 ? (
              <div className="font-body text-xs text-ink-faint">
                Nenhuma anomalia deste tipo
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border py-2 last:border-0"
                  >
                    <span className="font-body text-xs text-ink-muted">
                      User ID: {item.userId}
                    </span>
                    <span className={`font-data text-xs font-bold ${tone.count}`}>
                      {item.count}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
