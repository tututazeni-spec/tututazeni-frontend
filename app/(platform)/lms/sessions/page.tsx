'use client';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface Session {
  id: string;
  code: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  platform: string;
  status: string;
  meetingUrl: string | null;
  maxAttendees: number | null;
  instructor?: { fullName: string } | null;
  _count?: { attendances: number };
}

const PLATFORM_ICONS: Record<string, string> = {
  ZOOM: '🟦',
  TEAMS: '🟪',
  MEET: '🟩',
  WEBEX: '🟧',
  OTHER: '🔗',
};

export default function LiveSessionsPage() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };

  const { data: resp, isLoading: loading, error: queryError, refetch } =
    useApiQuery<{ data: Session[]; total: number; totalPages: number }>(
      queryKeys.lms.sessions(params), '/lms/sessions/upcoming',
      { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
    );

  const data = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const totalPages = resp?.totalPages ?? 1;
  const error = queryError?.message ?? '';
  const fetchData = () => refetch();

  const registerMut = useApiMutation(
    (sessionId: string) => apiClient.post(`/lms/sessions/${sessionId}/register`, {}),
    {
      invalidateKeys: [queryKeys.lms.all],
      onSuccess: () => alert('Inscrição na sessão realizada!'),
      onError: (e) => alert(e.message || 'Erro ao inscrever'),
    },
  );
  const register = (sessionId: string) => registerMut.mutate(sessionId);

  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sessões ao Vivo
          </h1>
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

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
