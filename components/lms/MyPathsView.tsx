// components/lms/MyPathsView.tsx

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ErrorBanner, MyPathsSkeleton } from './shared';
import { STATUS_INTENT } from './types';
import type { Analytics, MyPath } from './types';

interface MyPathsViewProps {
  paths: MyPath[];
  analytics: Analytics | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function MyPathsView({
  paths,
  analytics,
  loading,
  error,
  onRetry,
}: MyPathsViewProps) {
  if (loading) return <MyPathsSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          Os Meus Percursos
        </h1>
        <a
          href="/lms/paths"
          className="font-body text-sm text-primary hover:underline"
        >
          Explorar percursos →
        </a>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <KpiCard
            label="Horas"
            value={`${analytics.totalHours}h`}
            intent="primary"
          />
          <KpiCard
            label="Cursos concluídos"
            value={analytics.coursesCompleted}
            intent="accent"
          />
          <KpiCard
            label="Percursos concluídos"
            value={analytics.pathsCompleted}
            intent="success"
          />
          <KpiCard
            label="Sessões assistidas"
            value={analytics.sessionsAttended}
            intent="info"
          />
          <KpiCard
            label="Dias seguidos"
            value={analytics.streakDays}
            intent="warning"
          />
        </div>
      )}

      {/* Percursos */}
      {paths.length === 0 ? (
        <EmptyState
          title="Ainda sem percursos"
          description="Ainda não estás inscrito em nenhum percurso."
        />
      ) : (
        <div className="space-y-4">
          {paths.map((mp) => (
            <Card key={mp.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">
                      {mp.path.name}
                    </h3>
                    <p className="font-data text-xs text-ink-faint">
                      {mp.path.code} · {mp.path.level} ·{' '}
                      {mp.path.estimatedHours || '—'}h
                    </p>
                  </div>
                  <Badge intent={STATUS_INTENT[mp.status] ?? 'neutral'}>
                    {mp.status}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between font-body text-xs text-ink-muted">
                    <span>
                      {mp.completedCourseIds.length} cursos concluídos
                    </span>
                    <span>{Math.round(mp.progress)}%</span>
                  </div>
                  <ProgressBar value={mp.progress} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
