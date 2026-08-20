// components/academic/TranscriptView.tsx

import { CheckCircle2, Clock, GraduationCap, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { STATUS_INTENT } from './types';
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
      <h1 className="font-display text-2xl font-bold text-ink">
        A Minha Transcrição Académica
      </h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={GraduationCap}
          label="Média das Notas"
          value={transcript ? transcript.gpa.toFixed(1) : '—'}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={Clock}
          label="Horas concluídas"
          value={transcript ? `${transcript.totalHours}h` : '0h'}
          intent="accent"
          className="w-full"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Programas concluídos"
          value={transcript ? String(transcript.completedPrograms) : '0'}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={Hourglass}
          label="Em curso"
          value={transcript ? String(transcript.inProgressPrograms) : '0'}
          intent="warning"
          className="w-full"
        />
      </div>

      {/* Histórico */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Histórico de Matrículas ({enrollments.length})
        </h2>
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Ainda não tens matrículas"
              description="As matrículas em programas académicos aparecem aqui."
            />
          ) : (
            enrollments.map((e) => (
              <Card key={e.id}>
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-body font-semibold text-ink">
                        {e.program.name}
                      </h3>
                      <p className="font-data text-xs text-ink-muted">
                        {e.code} · {e.program.code} · {e.program.level} ·{' '}
                        {e.program.durationHours}h
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge intent={STATUS_INTENT[e.status] ?? 'neutral'}>
                        {e.status}
                      </Badge>
                      {e.finalScore != null && (
                        <p className="font-body text-sm font-bold text-ink mt-1">
                          {e.finalScore}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <ProgressBar value={e.progress} />
                  </div>

                  {/* Notas */}
                  {e.grades.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.grades.map((g) => (
                        <span
                          key={g.id}
                          className="font-body text-xs text-ink-muted border border-border bg-surface-sunken rounded-control px-2 py-1"
                        >
                          {g.courseName || 'Módulo'}: {g.score}/{g.maxScore}
                        </span>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
