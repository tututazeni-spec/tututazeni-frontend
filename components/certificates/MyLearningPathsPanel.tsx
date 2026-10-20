// components/certificates/MyLearningPathsPanel.tsx
// As minhas trilhas: progresso por unidade (cursos e formações obrigatórias) e
// estado do certificado da trilha. Só aparece quando o colaborador está
// inscrito em alguma trilha.

'use client';

import { Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PathProgress, type PathStep } from '@/components/ui/PathProgress';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import type { LearningPathProgress } from './types';

const KIND_LABEL: Record<'COURSE' | 'TRAINING', string> = {
  COURSE: 'Curso',
  TRAINING: 'Formação',
};

function certificateNote(cert: LearningPathProgress['certificate']): string {
  if (!cert)
    return 'Certificado emitido ao concluir todas as unidades obrigatórias';
  if (cert.status === 'PENDING_APPROVAL')
    return 'Certificado a aguardar aprovação';
  if (cert.status === 'REVOKED') return 'Certificado revogado';
  if (cert.status === 'EXPIRED') return 'Certificado expirado';
  return 'Certificado emitido';
}

function CertificateButton({ certificateId }: { certificateId: number }) {
  const { download, loading } = usePdfDownload(
    'certificate',
    String(certificateId),
  );
  return (
    <Button
      intent="secondary"
      size="sm"
      onClick={() => void download()}
      disabled={loading}
    >
      <Award size={14} strokeWidth={1.75} />
      Descarregar certificado
    </Button>
  );
}

function stepsOf(path: LearningPathProgress): PathStep[] {
  const firstPending = path.units.findIndex((u) => !u.done);
  return path.units.map((u, i) => ({
    label: u.title,
    status: u.done ? 'done' : i === firstPending ? 'current' : 'pending',
  }));
}

export function MyLearningPathsPanel({
  paths,
}: {
  paths: LearningPathProgress[];
}) {
  if (paths.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        As minhas trilhas
      </div>
      {paths.map((path) => {
        const downloadable =
          path.certificate &&
          (path.certificate.status === 'ACTIVE' ||
            path.certificate.status === 'EXPIRED');
        return (
          <Card key={path.learningPathId} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-semibold text-ink">
                  {path.title}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {certificateNote(path.certificate)}
                </div>
              </div>
              {downloadable && path.certificate && (
                <CertificateButton certificateId={path.certificate.id} />
              )}
            </div>

            <div className="flex items-center gap-3">
              <ProgressBar
                value={path.completionPct}
                intent={path.completionPct === 100 ? 'success' : 'accent'}
              />
              <span className="font-body text-xs tabular-nums text-ink-muted">
                {path.completionPct}%
              </span>
            </div>

            {path.units.length > 0 && (
              <div className="overflow-x-auto pb-1">
                <PathProgress steps={stepsOf(path)} className="min-w-max" />
              </div>
            )}

            <ul className="space-y-1">
              {path.units.map((u) => (
                <li
                  key={`${u.kind}-${u.id}`}
                  className="flex items-center justify-between gap-3 font-body text-xs text-ink-muted"
                >
                  <span className="truncate">
                    {KIND_LABEL[u.kind]} · {u.title}
                    {u.required ? '' : ' (opcional)'}
                  </span>
                  <span
                    className={u.done ? 'text-success-ink' : 'text-ink-faint'}
                  >
                    {u.done ? 'Concluída' : 'Por concluir'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
