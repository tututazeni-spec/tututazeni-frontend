// components/avatar-training/programs/ProgramSheetView.tsx
// Ficha da formação (§4): identificação, responsáveis, aprovação, avaliação,
// fontes aprovadas e regras de certificação (apresentação). Dados:
// hooks/useProgramSheet.ts; textos: ./logic.ts.

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ProgramSheetController } from '@/hooks/useProgramSheet';
import { EXPERIENCE_LABEL, PROGRAM_STATUS } from '../constants';
import {
  approvalSummary,
  assessmentSummary,
  categoryAndLevel,
  certificationSummary,
  courseSummary,
  languageAndDuration,
  learningPathLabel,
  linkedTrainingLabel,
  sessionHeading,
  sourcesSummary,
} from './logic';
import type { AvatarProgramDetail } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 font-body text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="col-span-2 text-ink">{children}</dd>
    </div>
  );
}

interface ProgramSheetViewProps {
  ctl: ProgramSheetController;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (p: AvatarProgramDetail) => void;
}

export function ProgramSheetView({
  ctl,
  canEdit,
  onClose,
  onEdit,
}: ProgramSheetViewProps) {
  const { program: data, error, refetch, certification, links } = ctl;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={data ? `${data.code} — ${data.title}` : 'Ficha da formação'}
        description="Ficha completa da formação virtual."
      >
        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {error ? (
            <QueryError error={error} onRetry={() => refetch()} />
          ) : !data ? (
            <Skeleton
              rows={4}
              itemClassName="h-6 rounded bg-surface-sunken animate-pulse"
            />
          ) : (
            <>
              <dl className="space-y-2">
                <Row label="Estado">
                  <StatusBadge
                    value={data.status}
                    map={PROGRAM_STATUS}
                    variant="dot"
                  />{' '}
                  · v{data.version}
                </Row>
                {data.description && (
                  <Row label="Descrição">{data.description}</Row>
                )}
                {data.objectives.length > 0 && (
                  <Row label="Objectivos">
                    <ul className="list-disc pl-4">
                      {data.objectives.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </Row>
                )}
                <Row label="Categoria e nível">{categoryAndLevel(data)}</Row>
                <Row label="Experiência">
                  {EXPERIENCE_LABEL[data.experienceType]}
                </Row>
                <Row label="Idioma e duração">{languageAndDuration(data)}</Row>
                <Row label="Avatar">
                  {data.avatar?.name ?? 'Sem avatar por defeito'}
                </Row>
                <Row label="Formador responsável">
                  {data.responsibleName ?? '—'}
                </Row>
                <Row label="Curso associado">{courseSummary(data)}</Row>
                <Row label="Aprovação">{approvalSummary(data)}</Row>
                <Row label="Certificação">{certificationSummary(data)}</Row>
                {links && links.trainings.length > 0 && (
                  <Row label="Formações ligadas (Trainings)">
                    <ul className="list-disc pl-4">
                      {links.trainings.map((t) => (
                        <li key={t.id}>{linkedTrainingLabel(t)}</li>
                      ))}
                    </ul>
                  </Row>
                )}
                {links && links.learningPaths.length > 0 && (
                  <Row label="Percursos de aprendizagem">
                    <ul className="list-disc pl-4">
                      {links.learningPaths.map((l) => (
                        <li key={l.id}>{learningPathLabel(l)}</li>
                      ))}
                    </ul>
                  </Row>
                )}
                {certification?.enabled && (
                  <Row label="A minha elegibilidade">
                    {certification.eligible ? (
                      'Elegível ao certificado'
                    ) : (
                      <ul className="list-disc pl-4">
                        {certification.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </Row>
                )}
              </dl>

              <section>
                <h3 className="mb-1 font-display text-sm font-semibold text-ink">
                  Sessões, avaliação e fontes aprovadas
                </h3>
                {data.sessions.length === 0 ? (
                  <EmptyState variant="inline" title="Sem sessões" />
                ) : (
                  <div className="space-y-2">
                    {data.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-card border border-border bg-surface p-2 font-body text-xs"
                      >
                        <div className="text-sm font-medium text-ink">
                          {sessionHeading(s)}
                        </div>
                        <div className="text-ink-muted">
                          {assessmentSummary(s)}
                        </div>
                        <div className="text-ink-faint">
                          {sourcesSummary(s)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-3">
          {canEdit && data && data.status !== 'ARCHIVED' && (
            <Button size="sm" intent="secondary" onClick={() => onEdit(data)}>
              Editar
            </Button>
          )}
          <Button size="sm" intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
