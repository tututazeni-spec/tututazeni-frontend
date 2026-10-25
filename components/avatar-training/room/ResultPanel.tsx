// components/avatar-training/room/ResultPanel.tsx
// Resultado da sessão, reforço e pedido de certificado (apresentação).

import { Button } from '@/components/ui/Button';
import type { TrainingRoomController } from '@/hooks/useTrainingRoom';
import { certificationMessage, outcomeTitle, scoreLine } from './logic';
import { FailureReinforcementNote } from './Notes';

export function ResultPanel({ ctl }: { ctl: TrainingRoomController }) {
  const {
    result,
    certification,
    certificateRequested,
    requestCertificate,
    pending,
  } = ctl;
  if (!result) return null;

  return (
    <div className="rounded-card border border-border bg-surface p-4 font-body text-sm">
      <p className="font-medium text-ink">{outcomeTitle(result.passed)}</p>
      {scoreLine(result) && (
        <p className="text-ink-muted">{scoreLine(result)}</p>
      )}
      {result.reinforcement && (
        <FailureReinforcementNote data={result.reinforcement} />
      )}
      {certification?.enabled && (
        <p className="mt-1 text-ink-muted">
          {certificationMessage(certification)}
        </p>
      )}
      {certification?.enabled && certification.eligible && (
        <Button
          size="sm"
          className="mt-2"
          loading={pending.certificate}
          disabled={certificateRequested}
          onClick={requestCertificate}
        >
          Pedir certificado
        </Button>
      )}
      <p className="mt-1 text-xs text-ink-faint">
        Concluir a sessão não conclui automaticamente o curso.
      </p>
    </div>
  );
}
