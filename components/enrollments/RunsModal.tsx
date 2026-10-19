// components/enrollments/RunsModal.tsx
// Histórico de realizações de uma matrícula (1.ª participação e reciclagens) com o
// certificado de cada uma. Distingue matrícula (o cabeçalho), realização (cada
// bloco) e certificado (linha dentro do bloco). Dados: GET /enrollments/:id/runs.

import { useApiQuery } from '@/hooks/useApiQuery';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

interface RunCertificate {
  id: number;
  status: string;
  revoked: boolean;
  issuedAt: string;
  expiresAt: string | null;
  code: string | null;
  current: boolean;
}

interface EnrollmentRunRow {
  id: number;
  cycle: number;
  reason: 'INITIAL' | 'EXPIRY_AUTO' | 'MANUAL';
  startedAt: string;
  completedAt: string | null;
  closedAt: string | null;
  lessonsCompleted: number;
  lessons: { lessonId: number; completed: boolean }[];
  certificates: RunCertificate[];
}

const REASON_LABEL: Record<EnrollmentRunRow['reason'], string> = {
  INITIAL: 'Primeira realização',
  EXPIRY_AUTO: 'Reciclagem automática',
  MANUAL: 'Reciclagem iniciada pelo RH',
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-PT') : '—';

/** Estado legível de um certificado: o vigente destaca-se dos históricos. */
export function certificateLabel(c: RunCertificate, now = Date.now()): string {
  if (c.revoked || c.status === 'REVOKED') return 'Revogado';
  if (c.status === 'PENDING_APPROVAL') return 'Por aprovar';
  if (
    c.status === 'EXPIRED' ||
    (c.expiresAt && new Date(c.expiresAt).getTime() <= now)
  ) {
    return 'Expirado';
  }
  return c.current ? 'Vigente' : 'Válido';
}

export interface RunsModalProps {
  enrollmentId: number;
  title: string;
  onClose: () => void;
}

export function RunsModal({ enrollmentId, title, onClose }: RunsModalProps) {
  const { data, isLoading } = useApiQuery<EnrollmentRunRow[]>(
    ['enrollments', 'runs', enrollmentId],
    `/enrollments/${enrollmentId}/runs`,
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Histórico de realizações"
        description={title}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-3">
          {isLoading && (
            <Skeleton
              rows={2}
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          )}
          {data?.length === 0 && (
            <p className="text-sm text-ink-muted">
              Sem realizações registadas.
            </p>
          )}
          {data
            ?.slice()
            .reverse()
            .map((run) => (
              <div
                key={run.id}
                className="rounded-card border border-border bg-surface-sunken p-4 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    Realização {run.cycle} · {REASON_LABEL[run.reason]}
                  </p>
                  <p className="text-ink-muted">
                    {fmt(run.startedAt)} →{' '}
                    {run.closedAt ? fmt(run.closedAt) : 'em curso'}
                  </p>
                </div>
                <p className="mt-1 text-ink-muted">
                  Concluída: {fmt(run.completedAt)}
                  {run.lessons.length > 0 &&
                    ` · ${run.lessonsCompleted}/${run.lessons.length} aulas`}
                </p>
                {run.certificates.length === 0 ? (
                  <p className="mt-2 text-ink-muted">Sem certificado.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {run.certificates.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap justify-between gap-2"
                      >
                        <span className="text-ink">
                          Certificado {c.code ?? `#${c.id}`} · emitido{' '}
                          {fmt(c.issuedAt)}
                          {c.expiresAt && ` · validade ${fmt(c.expiresAt)}`}
                        </span>
                        <span
                          className={
                            c.current
                              ? 'font-medium text-success-ink'
                              : 'text-ink-muted'
                          }
                        >
                          {certificateLabel(c)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      </ModalContent>
    </Modal>
  );
}
