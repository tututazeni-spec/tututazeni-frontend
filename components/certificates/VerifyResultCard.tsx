// components/certificates/VerifyResultCard.tsx
// Resultado da verificação pública de um certificado. Só mostra "válido" quando
// o estado actual do registo é ACTIVE — revogado/expirado nunca passam por válido.

import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/format';
import type { PublicVerifyResult, VerifyCardResult } from './types';

const STATUS_VIEW: Record<
  string,
  { label: string; intent: 'success' | 'danger' | 'warning' }
> = {
  ACTIVE: { label: 'Certificado válido', intent: 'success' },
  EXPIRED: { label: 'Certificado expirado', intent: 'warning' },
  REVOKED: { label: 'Certificado revogado', intent: 'danger' },
};

const TYPE_LABEL: Record<string, string> = {
  COURSE: 'Curso',
  TRAINING: 'Formação',
  LEARNING_PATH: 'Trilha de aprendizagem',
  EVENT: 'Evento',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

export function VerifyResultCard({
  result,
  downloadUrl,
}: {
  result: VerifyCardResult;
  /** Ligação pública do PDF; só é mostrada para certificados válidos. */
  downloadUrl?: string;
}) {
  if ('notFound' in result) {
    return (
      <AlertCard
        variant="danger"
        title="Certificado não encontrado"
        message="Confirme o código impresso no certificado ou leia novamente o QR Code."
      />
    );
  }

  const r: PublicVerifyResult = result;
  const view = STATUS_VIEW[r.status] ?? STATUS_VIEW.REVOKED;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge intent={view.intent}>{view.label}</Badge>
        {r.origin === 'EXTERNAL' && (
          <Badge intent="neutral">Certificado externo</Badge>
        )}
      </div>
      <h1 className="mt-4 text-xl font-semibold text-ink">{r.holderName}</h1>
      <p className="text-ink-muted">{r.title}</p>
      {r.origin === 'EXTERNAL' && (
        <p className="mt-2 text-sm text-ink-muted">
          Importado para a plataforma; emitido por {r.issuerName}, não pela
          academia.
        </p>
      )}
      <div className="mt-4">
        <Row label="Entidade emissora" value={r.issuerName} />
        <Row label="Tipo" value={TYPE_LABEL[r.type] ?? r.type} />
        {r.hours ? <Row label="Carga horária" value={`${r.hours} h`} /> : null}
        <Row label="Data de emissão" value={formatDate(r.issuedAt)} />
        {r.expiresAt ? (
          <Row label="Válido até" value={formatDate(r.expiresAt)} />
        ) : null}
      </div>
      {downloadUrl && r.status === 'ACTIVE' && (
        <a
          href={downloadUrl}
          className={`${buttonVariants({ intent: 'primary' })} mt-6 w-full rounded-card px-4 py-3`}
        >
          Descarregar PDF
        </a>
      )}
    </Card>
  );
}
