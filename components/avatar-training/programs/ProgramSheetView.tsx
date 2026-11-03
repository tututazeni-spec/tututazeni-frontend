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

/** Campo em mosaico: rótulo pequeno por cima, valor por baixo. */
function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd className="mt-0.5 font-body text-sm text-ink">{children}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-3">
      <h3 className="mb-2 font-display text-sm font-semibold text-ink">
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
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
            <Skeleton rows={4} itemClassName="h-6 rounded bg-surface-sunken" />
          ) : (
            <>
              <Group title="Resumo">
                <Field label="Estado">
                  <StatusBadge
                    value={data.status}
                    map={PROGRAM_STATUS}
                    variant="dot"
                  />{' '}
                  · v{data.version}
                </Field>
                <Field label="Experiência">
                  {EXPERIENCE_LABEL[data.experienceType]}
                </Field>
                <Field label="Categoria e nível">
                  {categoryAndLevel(data)}
                </Field>
                <Field label="Idioma e duração">
                  {languageAndDuration(data)}
                </Field>
                {data.description && (
                  <Field label="Descrição" wide>
                    {data.description}
                  </Field>
                )}
                {data.objectives.length > 0 && (
                  <Field label="Objectivos" wide>
                    <BulletList items={data.objectives} />
                  </Field>
                )}
              </Group>

              <Group title="Responsáveis e certificação">
                <Field label="Formador responsável">
                  {data.responsibleName ?? '—'}
                </Field>
                <Field label="Avatar">
                  {data.avatar?.name ?? 'Sem avatar por defeito'}
                </Field>
                <Field label="Curso associado">{courseSummary(data)}</Field>
                <Field label="Aprovação">{approvalSummary(data)}</Field>
                <Field label="Certificação" wide={!certification?.enabled}>
                  {certificationSummary(data)}
                </Field>
                {certification?.enabled && (
                  <Field label="A minha elegibilidade">
                    {certification.eligible ? (
                      'Elegível ao certificado'
                    ) : (
                      <BulletList items={certification.reasons} />
                    )}
                  </Field>
                )}
              </Group>

              {links &&
                (links.trainings.length > 0 ||
                  links.learningPaths.length > 0) && (
                  <Group title="Ligações">
                    {links.trainings.length > 0 && (
                      <Field label="Formações ligadas (Trainings)">
                        <BulletList
                          items={links.trainings.map((t) =>
                            linkedTrainingLabel(t),
                          )}
                        />
                      </Field>
                    )}
                    {links.learningPaths.length > 0 && (
                      <Field label="Percursos de aprendizagem">
                        <BulletList
                          items={links.learningPaths.map((l) =>
                            learningPathLabel(l),
                          )}
                        />
                      </Field>
                    )}
                  </Group>
                )}

              <section className="rounded-card border border-border bg-surface p-3">
                <h3 className="mb-2 font-display text-sm font-semibold text-ink">
                  Sessões, avaliação e fontes aprovadas
                </h3>
                {data.sessions.length === 0 ? (
                  <EmptyState variant="inline" title="Sem sessões" />
                ) : (
                  <div className="space-y-2">
                    {data.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-card border border-border bg-surface-sunken p-2.5 font-body text-xs"
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
