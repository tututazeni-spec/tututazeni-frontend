// components/live-classes/SettingsView.tsx
// Separador "Configurações" (docs/aulas-ao-vivo.md secção 14) — vista
// agregada e só de leitura sobre os enums do domínio, os valores por omissão
// reais do schema e os papéis já aplicados no controller. Mesmo padrão de
// components/evaluation/SettingsTab.tsx (não inventa um mecanismo novo de
// configuração para o que já é código).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import {
  ENROLLMENT_MODE_CFG,
  LIVE_ATTENDANCE_STATUS_CFG,
  MODALITY_CFG,
  RECURRENCE_CFG,
  STATUS_CFG,
  TYPE_CFG,
} from './constants';
import type { LiveClassesSettings } from './types';

export function SettingsView() {
  const { data, isLoading, error, refetch } = useApiQuery<LiveClassesSettings>(
    queryKeys.liveClasses.settings(),
    '/live-classes/settings',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) {
    return <Skeleton rows={4} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-24 rounded-card" />;
  }
  if (error || !data) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Tipos de aula</h4>
            <div className="flex flex-wrap gap-2">
              {data.types.map((t) => (
                <Badge key={t} intent="neutral" className={TYPE_CFG[t]?.cls}>
                  {TYPE_CFG[t]?.label ?? t}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Modalidades</h4>
            <div className="flex flex-wrap gap-2">
              {data.modalities.map((m) => (
                <Badge key={m} intent="neutral">
                  {MODALITY_CFG[m]?.label ?? m}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Estados</h4>
            <div className="flex flex-wrap gap-2">
              {data.statuses.map((s) => (
                <Badge key={s} intent="neutral" className={STATUS_CFG[s]?.cls}>
                  {STATUS_CFG[s]?.label ?? s}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Recorrência</h4>
            <div className="flex flex-wrap gap-2">
              {data.recurrences.map((r) => (
                <Badge key={r} intent="neutral">
                  {RECURRENCE_CFG[r]?.label ?? r}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Inscrição</h4>
            <div className="flex flex-wrap gap-2">
              {data.enrollmentModes.map((m) => (
                <Badge key={m} intent="neutral">
                  {ENROLLMENT_MODE_CFG[m]?.label ?? m}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Estados de presença</h4>
            <div className="flex flex-wrap gap-2">
              {data.attendanceStatuses.map((s) => (
                <Badge key={s} intent="neutral" className={LIVE_ATTENDANCE_STATUS_CFG[s]?.cls}>
                  {LIVE_ATTENDANCE_STATUS_CFG[s]?.label ?? s}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Regras de presença (por omissão)</h4>
            <div className="space-y-2 font-body text-sm text-ink-muted">
              <div className="flex justify-between">
                <span>Percentagem mínima de presença</span>
                <span className="font-medium text-ink">{data.attendanceDefaults.minAttendancePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Tolerância de atraso</span>
                <span className="font-medium text-ink">{data.attendanceDefaults.lateToleranceMinutes} min</span>
              </div>
            </div>
            <p className="mt-2 font-body text-xs text-ink-faint">
              Valores aplicados a novas aulas — ajustáveis por aula na Etapa 6 do assistente.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="mb-3 font-display font-semibold text-ink">Política de gravação (por omissão)</h4>
            <div className="space-y-2 font-body text-sm text-ink-muted">
              <div className="flex justify-between">
                <span>Gravar sessão</span>
                <Badge intent={data.recordingDefaults.recordSession ? 'success' : 'neutral'}>
                  {data.recordingDefaults.recordSession ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Permitir download</span>
                <Badge intent={data.recordingDefaults.allowRecordingDownload ? 'success' : 'neutral'}>
                  {data.recordingDefaults.allowRecordingDownload ? 'Sim' : 'Não'}
                </Badge>
              </div>
            </div>
            <p className="mt-2 font-body text-xs text-ink-faint">
              Gravações vão para Object Storage / CDN — nunca para o servidor da aplicação (ver docs/aulas-ao-vivo.md).
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h4 className="mb-3 font-display font-semibold text-ink">Notificações</h4>
          <p className="mb-2 font-body text-xs text-ink-faint">
            Eventos configuráveis por aula (Etapa 9) e canais disponíveis conforme as integrações activas.
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            {data.notifySettingsKeys.map((k) => (
              <Badge key={k} intent="info">
                {k}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.notificationChannels.map((c) => (
              <Badge key={c} intent="neutral">
                {c}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h4 className="mb-3 font-display font-semibold text-ink">Permissões</h4>
          <div className="space-y-2">
            {data.permissions.map((p) => (
              <div
                key={p.action}
                className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-surface-sunken px-3 py-2"
              >
                <span className="font-body text-sm text-ink">{p.action}</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.roles.map((r) => (
                    <Badge key={r} intent="neutral">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
