// components/lms/MyPathsView.tsx

import { ErrorBanner, MyPathsSkeleton } from './shared';
import { STATUS_COLORS } from './types';
import type { Analytics, MyPath } from './types';

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Os Meus Percursos</h1>
        <a href="/lms/paths" className="text-sm text-blue-600 hover:underline">
          Explorar percursos →
        </a>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Horas" value={`${analytics.totalHours}h`} />
          <Stat label="Cursos concluídos" value={analytics.coursesCompleted} />
          <Stat label="Percursos concluídos" value={analytics.pathsCompleted} />
          <Stat label="Sessões assistidas" value={analytics.sessionsAttended} />
          <Stat label="Dias seguidos" value={analytics.streakDays} />
        </div>
      )}

      {/* Percursos */}
      {paths.length === 0 ? (
        <p className="text-gray-400">
          Ainda não estás inscrito em nenhum percurso.
        </p>
      ) : (
        <div className="space-y-4">
          {paths.map((mp) => (
            <div key={mp.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {mp.path.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {mp.path.code} · {mp.path.level} ·{' '}
                    {mp.path.estimatedHours || '—'}h
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[mp.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {mp.status}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{mp.completedCourseIds.length} cursos concluídos</span>
                  <span>{Math.round(mp.progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, mp.progress)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
