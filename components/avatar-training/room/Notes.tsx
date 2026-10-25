// components/avatar-training/room/Notes.tsx
// Reforço pedagógico mostrado na sala (apresentação).

import { safeHref } from '@/lib/safeHref';
import type { FailureReinforcement, StepReinforcementPayload } from '../types';

/** Reforço após uma resposta errada (§7): mensagem, etapa a rever e conteúdo complementar. */
export function ReinforcementNote({
  reinforcement,
}: {
  reinforcement: StepReinforcementPayload;
}) {
  return (
    <div className="mt-2 space-y-1 border-t border-border pt-2 text-xs">
      {reinforcement.message && <p>{reinforcement.message}</p>}
      {reinforcement.reviewStepTitle && (
        <p>Reveja a etapa «{reinforcement.reviewStepTitle}».</p>
      )}
      {reinforcement.resourceUrl && (
        <a
          href={safeHref(reinforcement.resourceUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Abrir conteúdo complementar
        </a>
      )}
      {reinforcement.retry && (
        <p className="font-medium">
          Tente de novo para avançar ({reinforcement.retriesLeft}{' '}
          {reinforcement.retriesLeft === 1
            ? 'tentativa restante'
            : 'tentativas restantes'}
          ).
        </p>
      )}
    </div>
  );
}

/** Conteúdo complementar quando a nota fica abaixo da mínima. */
export function FailureReinforcementNote({
  data,
}: {
  data: FailureReinforcement;
}) {
  return (
    <div className="mt-2 space-y-1 rounded-card bg-surface-sunken p-3 text-xs text-ink">
      {data.message && <p>{data.message}</p>}
      {data.weakSteps.length > 0 && (
        <div>
          <p className="font-medium">Etapas a reforçar:</p>
          <ul className="list-disc pl-4">
            {data.weakSteps.map((w) => (
              <li key={w.stepKey}>
                {w.title}
                {w.message ? ` — ${w.message}` : ''}
                {w.resourceUrl && (
                  <>
                    {' '}
                    <a
                      href={safeHref(w.resourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      conteúdo
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.resourceUrl && (
        <a
          href={safeHref(data.resourceUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Abrir conteúdo complementar
        </a>
      )}
      {data.recommendSessionId && (
        <p>Sessão complementar recomendada (id {data.recommendSessionId}).</p>
      )}
    </div>
  );
}
