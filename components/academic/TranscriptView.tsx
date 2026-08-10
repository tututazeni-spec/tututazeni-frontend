// components/academic/TranscriptView.tsx

import { SummaryCard } from './shared';
import { STATUS_COLORS } from './types';
import type { Enrollment, Transcript } from './types';

interface TranscriptViewProps {
  transcript: Transcript | null;
  enrollments: Enrollment[];
}

export function TranscriptView({
  transcript,
  enrollments,
}: TranscriptViewProps) {
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
