// components/academic/ProgramDetailView.tsx

import { useRouter } from 'next/navigation';
import { Info } from './shared';
import { LEVEL_COLORS } from './types';
import type { ProgramDetail } from './types';

interface ProgramDetailViewProps {
  program: ProgramDetail;
  enrolling: boolean;
  enroll: (classId?: string) => void;
}

export function ProgramDetailView({
  program: p,
  enrolling,
  enroll,
}: ProgramDetailViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <button
        onClick={() => router.push('/academic/programs')}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar aos programas
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-xs text-blue-600">{p.code}</p>
            <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              LEVEL_COLORS[p.level] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {p.level}
          </span>
        </div>
        {p.description && <p className="text-gray-600 mt-3">{p.description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Info label="Carga horária" value={`${p.durationHours}h`} />
          <Info label="Nota mínima" value={`${p.passingScore}%`} />
          <Info label="Alunos" value={String(p._count.enrollments)} />
          <Info label="Obrigatório" value={p.isMandatory ? 'Sim' : 'Não'} />
        </div>
        <button
          onClick={() => enroll()}
          disabled={enrolling}
          className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {enrolling ? 'A submeter...' : 'Matricular-me'}
        </button>
      </div>

      {/* Turmas */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Turmas ({p.classes.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {p.classes.length === 0 ? (
            <p className="p-4 text-gray-400">Sem turmas disponíveis</p>
          ) : (
            p.classes.map((c) => (
              <div key={c.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.modality} · {c.status}
                    {c.instructor?.fullName
                      ? ` · ${c.instructor.fullName}`
                      : ''}
                    {' · '}
                    {c._count?.enrollments ?? 0} inscritos
                  </p>
                </div>
                <button
                  onClick={() => enroll(c.id)}
                  disabled={enrolling}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  Inscrever
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
