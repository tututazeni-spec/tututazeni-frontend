// components/scalability/RetentionStatusCard.tsx
// modulo_scalability.md §28 — estado da retenção e do downsampling (aba Configurações).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Header, Note } from './InfraTabs';

interface RetentionStatus {
  retentionDays: number;
  hourlyRetentionDays: number;
  rows: { raw: number; queue: number; endpoint: number; hourly: number };
  oldestRawAt: string | null;
  lastRolledUpHour: string | null;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pt-PT', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';

export function RetentionStatusCard() {
  const { data } = useApiQuery<RetentionStatus>(
    ['scalability', 'history-retention'],
    '/scalability/history/retention',
    { staleTime: STALE_TIME.DYNAMIC, retry: false },
  );
  if (!data) return null;

  const rows: Array<[string, number]> = [
    ['Amostras brutas (1/min)', data.rows.raw],
    ['Filas (5 min)', data.rows.queue],
    ['Endpoints (5 min)', data.rows.endpoint],
    ['Agregadas por hora', data.rows.hourly],
  ];

  return (
    <div className="flex flex-col gap-3">
      <Header
        title="Retenção e agregação"
        sub={`Brutas, filas e endpoints: ${data.retentionDays} dias · agregadas por hora: ${data.hourlyRetentionDays} dias`}
      />
      <Card>
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 font-body text-sm lg:grid-cols-4">
            {rows.map(([label, n]) => (
              <div key={label}>
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-display text-lg font-bold text-ink">
                  {n.toLocaleString('pt-PT')}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3">
            <Note>
              {`Amostra bruta mais antiga: ${fmtDate(data.oldestRawAt)} · última hora agregada: ${fmtDate(data.lastRolledUpHour)}`}
            </Note>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
