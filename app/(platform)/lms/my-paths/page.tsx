'use client';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface MyPath {
  id: string;
  progress: number;
  status: string;
  completedCourseIds: string[];
  startedAt: string;
  path: {
    name: string;
    code: string;
    level: string;
    estimatedHours: number | null;
    thumbnail: string | null;
  };
}

interface Analytics {
  totalHours: number;
  coursesCompleted: number;
  pathsCompleted: number;
  sessionsAttended: number;
  streakDays: number;
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  PAUSED: 'bg-gray-100 text-gray-600',
  DROPPED: 'bg-red-100 text-red-700',
};

export default function MyPathsPage() {
  // Percursos e analytics em paralelo (queries independentes).
  const pathsQ = useApiQuery<MyPath[]>(
    queryKeys.lms.myPaths(), '/lms/my-paths',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const anaQ = useApiQuery<Analytics>(
    queryKeys.lms.myAnalytics(), '/lms/my-analytics',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const paths = pathsQ.data ?? [];
  const analytics = anaQ.data ?? null;
  const loading = pathsQ.isLoading;
  const error = pathsQ.error?.message ?? '';
  const fetchData = () => { pathsQ.refetch(); anaQ.refetch(); };

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={fetchData} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Os Meus Percursos
        </h1>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
