'use client';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface AcademicClass {
  id: string;
  name: string;
  modality: string;
  status: string;
  startDate: string;
  endDate: string;
  instructor?: { fullName: string } | null;
  _count?: { enrollments: number };
}

interface ProgramDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  level: string;
  durationHours: number;
  passingScore: number;
  maxStudents: number | null;
  isMandatory: boolean;
  prerequisites: string[];
  createdBy?: { fullName: string } | null;
  classes: AcademicClass[];
  _count: { enrollments: number };
}

const LEVEL_COLORS: Record<string, string> = {
  BASIC: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  EXPERT: 'bg-red-100 text-red-800',
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: p, isLoading: loading, error: queryError } =
    useApiQuery<ProgramDetail>(
      queryKeys.academic.program(id), `/academic/programs/${id}`,
      { enabled: !!id, staleTime: STALE_TIME.SEMI_STATIC },
    );
  const error = queryError?.message ?? '';

  const enrollMut = useApiMutation(
    async (classId: string | undefined) => {
      // O backend precisa do userId → obtém-se de /auth/me antes do POST.
      const me = await apiClient.get<any>('/auth/me');
      const userId = me?.id ?? me?.user?.id;
      if (!userId) throw new Error('Utilizador sem ID');
      return apiClient.post('/academic/enrollments', {
        userId: Number(userId),
        programId: id,
        ...(classId && { classId }),
      });
    },
    {
      invalidateKeys: [queryKeys.academic.program(id), queryKeys.academic.transcript()],
      onSuccess: () => {
        alert('Matrícula submetida com sucesso!');
        router.push('/academic/transcript');
      },
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );
  const enrolling = enrollMut.isPending;
  const enroll = (classId?: string) => enrollMut.mutate(classId);

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );

  if (error || !p)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Programa não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

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
        {p.description && (
          <p className="text-gray-600 mt-3">{p.description}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Info label="Carga horária" value={`${p.durationHours}h`} />
          <Info label="Nota mínima" value={`${p.passingScore}%`} />
          <Info label="Alunos" value={String(p._count.enrollments)} />
          <Info
            label="Obrigatório"
            value={p.isMandatory ? 'Sim' : 'Não'}
          />
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}
