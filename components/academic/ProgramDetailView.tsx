// components/academic/ProgramDetailView.tsx

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Info } from './shared';
import { LEVEL_INTENT } from './types';
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
        className="font-body text-sm text-primary hover:underline"
      >
        ← Voltar aos programas
      </button>

      <Card>
        <CardBody>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-data text-xs text-accent">{p.code}</p>
              <h1 className="font-display text-2xl font-bold text-ink">{p.name}</h1>
            </div>
            <Badge intent={LEVEL_INTENT[p.level] ?? 'neutral'}>{p.level}</Badge>
          </div>
          {p.description && (
            <p className="font-body text-ink-muted mt-3">{p.description}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Info label="Carga horária" value={`${p.durationHours}h`} />
            <Info label="Nota mínima" value={`${p.passingScore}%`} />
            <Info label="Alunos" value={String(p._count.enrollments)} />
            <Info label="Obrigatório" value={p.isMandatory ? 'Sim' : 'Não'} />
          </div>
          <Button onClick={() => enroll()} disabled={enrolling} className="mt-5">
            {enrolling ? 'A submeter...' : 'Matricular-me'}
          </Button>
        </CardBody>
      </Card>

      {/* Turmas */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Turmas ({p.classes.length})
        </h2>
        <Card className="divide-y divide-border">
          {p.classes.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">Sem turmas disponíveis</p>
          ) : (
            p.classes.map((c) => (
              <div key={c.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-body font-medium text-ink">{c.name}</p>
                  <p className="font-body text-xs text-ink-muted">
                    {c.modality} · {c.status}
                    {c.instructor?.fullName
                      ? ` · ${c.instructor.fullName}`
                      : ''}
                    {' · '}
                    {c._count?.enrollments ?? 0} inscritos
                  </p>
                </div>
                <Button
                  size="sm"
                  intent="ghost"
                  onClick={() => enroll(c.id)}
                  disabled={enrolling}
                >
                  Inscrever
                </Button>
              </div>
            ))
          )}
        </Card>
      </section>
    </div>
  );
}
