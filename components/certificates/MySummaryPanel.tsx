// components/certificates/MySummaryPanel.tsx
// Resumo pessoal do colaborador: certificados a aguardar aprovação, a expirar em
// breve e formações obrigatórias por concluir. Só mostra os blocos com dados.

import { AlertCard } from '@/components/ui/AlertCard';
import { formatDate } from '@/lib/format';
import type { MySummary } from './types';

export function MySummaryPanel({ summary }: { summary: MySummary }) {
  const { pending, expiringSoon, mandatoryMissing } = summary;
  if (!pending.length && !expiringSoon.length && !mandatoryMissing.length)
    return null;

  return (
    <div className="space-y-3">
      {mandatoryMissing.length > 0 && (
        <AlertCard
          variant="warning"
          title="Formações obrigatórias por concluir"
          message={
            mandatoryMissing.length === 1
              ? 'Tem 1 formação obrigatória por concluir.'
              : `Tem ${mandatoryMissing.length} formações obrigatórias por concluir.`
          }
          detail={mandatoryMissing
            .map((m) =>
              m.deadline
                ? `${m.title} (até ${formatDate(m.deadline)})`
                : m.title,
            )
            .join(' · ')}
        />
      )}
      {expiringSoon.length > 0 && (
        <AlertCard
          variant="info"
          title="A expirar em breve"
          message={
            expiringSoon.length === 1
              ? 'Tem 1 certificado a expirar nos próximos dias. Refaça a formação para o renovar.'
              : `Tem ${expiringSoon.length} certificados a expirar nos próximos dias. Refaça as formações para os renovar.`
          }
          detail={expiringSoon
            .map((c) => `${c.title} (${formatDate(c.expiresAt)})`)
            .join(' · ')}
        />
      )}
      {pending.length > 0 && (
        <AlertCard
          variant="info"
          title="A aguardar aprovação"
          message={
            pending.length === 1
              ? '1 certificado aguarda aprovação antes de ficar disponível.'
              : `${pending.length} certificados aguardam aprovação antes de ficarem disponíveis.`
          }
          detail={pending.map((c) => c.title).join(' · ')}
        />
      )}
    </div>
  );
}
