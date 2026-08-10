// components/lms/LiveSessionsView.tsx

import { formatDateTime } from '@/lib/format';
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessões ao Vivo</h1>
          <p className="text-gray-500">{total} próximas sessões</p>
        </div>
        <a href="/lms/paths" className="text-sm text-blue-600 hover:underline">
          ← Percursos
        </a>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-400">Sem sessões agendadas.</p>
      ) : (
        <div className="space-y-4">
          {data.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-lg shadow p-5 flex justify-between items-center"
            >
              <div className="flex gap-4 items-start">
                <div className="text-3xl">
                  {PLATFORM_ICONS[s.platform] || '🔗'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-xs text-gray-500 font-mono">{s.code}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(s.scheduledAt)} · {s.duration} min
                    {s.instructor?.fullName
                      ? ` · ${s.instructor.fullName}`
                      : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {s._count?.attendances ?? 0}
                    {s.maxAttendees ? `/${s.maxAttendees}` : ''} inscritos ·{' '}
                    {s.status}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button
                  onClick={() => register(s.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Inscrever-me
                </button>
                {s.meetingUrl && (
                  <a
                    href={s.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Link da reunião
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-gray-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
