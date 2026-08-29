// components/lms/LiveSessionsView.tsx

import { Video } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner, ListSkeleton } from './shared';
import { PLATFORM_ICONS } from './types';
import type { Session } from './types';

interface LiveSessionsViewProps {
  data: Session[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  register: (sessionId: string) => void;
}

export function LiveSessionsView({
  data,
  total,
  totalPages,
  page,
  setPage,
  loading,
  error,
  onRetry,
  register,
}: LiveSessionsViewProps) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Sessões ao Vivo
          </h1>
          <p className="font-body text-ink-muted">{total} próximas sessões</p>
        </div>
        <a
          href="/lms/paths"
          className="font-body text-sm text-primary hover:underline"
        >
          ← Percursos
        </a>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Sem sessões agendadas"
          description="Não há sessões ao vivo agendadas de momento."
        />
      ) : (
        <div className="space-y-4">
          {data.map((s) => (
            <Card key={s.id}>
              <CardBody className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">
                    {PLATFORM_ICONS[s.platform] || '🔗'}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">
                      {s.title}
                    </h3>
                    <p className="font-data text-xs text-ink-faint">{s.code}</p>
                    <p className="mt-1 font-body text-sm text-ink-muted">
                      {formatDateTime(s.scheduledAt)} · {s.duration} min
                      {s.instructor?.fullName
                        ? ` · ${s.instructor.fullName}`
                        : ''}
                    </p>
                    <p className="mt-1 font-body text-xs text-ink-faint">
                      {s._count?.attendances ?? 0}
                      {s.maxAttendees ? `/${s.maxAttendees}` : ''} inscritos ·{' '}
                      {s.status}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button size="sm" onClick={() => register(s.id)}>
                    Inscrever-me
                  </Button>
                  {s.meetingUrl && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-body text-xs text-primary hover:underline"
                    >
                      Link da reunião
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-body text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
