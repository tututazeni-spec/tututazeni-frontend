'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Grade {
  id: string;
  courseName: string | null;
  score: number;
  maxScore: number;
}
interface Enrollment {
  id: string;
  code: string;
  status: string;
  finalScore: number | null;
  progress: number;
  program: {
    name: string;
    code: string;
    durationHours: number;
    level: string;
  };
  grades: Grade[];
}
interface Transcript {
  gpa: number;
  totalHours: number;
  completedPrograms: number;
  inProgressPrograms: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-700',
  DROPPED: 'bg-gray-100 text-gray-500',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/academic/transcript`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar a transcrição');
      const json = await res.json();
      setTranscript(json.transcript);
      setEnrollments(json.enrollments || []);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
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
      <h1 className="text-2xl font-bold text-gray-900">
        A Minha Transcrição Académica
      </h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="GPA"
          value={transcript ? transcript.gpa.toFixed(1) : '—'}
          color="text-blue-600"
        />
        <SummaryCard
          label="Horas concluídas"
          value={transcript ? `${transcript.totalHours}h` : '0h'}
        />
        <SummaryCard
          label="Programas concluídos"
          value={transcript ? String(transcript.completedPrograms) : '0'}
          color="text-green-600"
        />
        <SummaryCard
          label="Em curso"
          value={transcript ? String(transcript.inProgressPrograms) : '0'}
          color="text-yellow-600"
        />
      </div>

      {/* Histórico */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Histórico de Matrículas ({enrollments.length})
        </h2>
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <p className="text-gray-400">Ainda não tens matrículas.</p>
          ) : (
            enrollments.map((e) => (
              <div key={e.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {e.program.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {e.code} · {e.program.code} · {e.program.level} ·{' '}
                      {e.program.durationHours}h
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {e.status}
                    </span>
                    {e.finalScore != null && (
                      <p className="text-sm font-bold text-gray-700 mt-1">
                        {e.finalScore}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, e.progress)}%` }}
                  />
                </div>

                {/* Notas */}
                {e.grades.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {e.grades.map((g) => (
                      <span
                        key={g.id}
                        className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                      >
                        {g.courseName || 'Módulo'}: {g.score}/{g.maxScore}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
