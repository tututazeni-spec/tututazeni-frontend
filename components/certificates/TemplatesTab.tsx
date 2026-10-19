// components/certificates/TemplatesTab.tsx
// Consulta dos modelos de certificado existentes. A edição, a pré-visualização
// e a biblioteca de 9 modelos pertencem a uma fase seguinte — por isso esta
// vista é só de leitura e não tem botões de edição.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { TEMPLATE_TYPE_LABEL } from './labels';
import type { CertificateTemplateRow } from './types';

export function TemplatesTab() {
  const { data, isLoading, error, refetch } = useApiQuery<
    CertificateTemplateRow[]
  >(queryKeys.certificates.templates(), '/certificates/templates', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Modelos disponíveis para emissão. A edição e a pré-visualização dos
        modelos chegam numa próxima fase.
      </p>
      {!data || data.length === 0 ? (
        <EmptyState
          title="Sem modelos"
          description="Ainda não existem modelos de certificado configurados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-ink">{t.name}</div>
                <div className="flex gap-1">
                  {t.isDefault && <Badge intent="info">Predefinido</Badge>}
                  {!t.isActive && <Badge intent="neutral">Inactivo</Badge>}
                </div>
              </div>
              {t.description && (
                <p className="mt-1 text-sm text-ink-muted">{t.description}</p>
              )}
              <dl className="mt-3 space-y-1 text-xs text-ink-muted">
                <div className="flex justify-between">
                  <dt>Tipo</dt>
                  <dd>{TEMPLATE_TYPE_LABEL[t.type] ?? t.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Validade</dt>
                  <dd>
                    {t.validityDays
                      ? `${t.validityDays} dias`
                      : 'Sem expiração'}
                  </dd>
                </div>
                {t.signatoryName && (
                  <div className="flex justify-between">
                    <dt>Assinatura</dt>
                    <dd>
                      {t.signatoryName}
                      {t.signatoryTitle ? `, ${t.signatoryTitle}` : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
