// components/certificates/TemplateGallery.tsx
// Biblioteca dos nove modelos de certificado. Todos usam o mesmo motor; cada um tem
// a sua composição visual e pode ser personalizado (cada gravação cria uma versão
// nova — os certificados já emitidos não mudam).

'use client';

import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { TemplateEditorModal } from './TemplateEditorModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { COLOR_LABEL } from './templateLabels';
import type { TemplateSummaryRow } from './types';

export function TemplateGallery({ canEdit }: { canEdit: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery<TemplateSummaryRow[]>(
    queryKeys.certificates.templates(),
    '/certificates/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sem modelos"
        description="Não foi possível carregar a biblioteca de modelos de certificado."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Nove modelos de certificado, todos personalizáveis. Cada gravação cria
        uma versão nova do modelo; os certificados já emitidos mantêm o aspecto
        com que foram emitidos.
      </p>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((t) => (
          <li key={t.id}>
            <Card className="h-full overflow-hidden">
              <div
                className="h-3"
                style={{
                  background: `linear-gradient(90deg, ${t.colors.primary}, ${t.colors.accent})`,
                }}
              />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{t.name}</h3>
                  <span className="whitespace-nowrap text-xs text-ink-muted">
                    Versão {t.currentVersion}
                  </span>
                </div>
                {t.description && (
                  <p className="text-sm text-ink-muted">{t.description}</p>
                )}
                <div className="flex gap-1.5">
                  {(
                    Object.keys(COLOR_LABEL) as (keyof typeof COLOR_LABEL)[]
                  ).map((k) => (
                    <span
                      key={k}
                      aria-label={`${COLOR_LABEL[k]} ${t.colors[k]}`}
                      title={`${COLOR_LABEL[k]} ${t.colors[k]}`}
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: t.colors[k] }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => setPreviewing(t.id)}
                  >
                    <Eye size={14} strokeWidth={1.75} />
                    Pré-visualizar
                  </Button>
                  {canEdit && (
                    <Button size="sm" onClick={() => setEditing(t.id)}>
                      <Pencil size={14} strokeWidth={1.75} />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {previewing && (
        <TemplatePreviewModal
          templateId={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
      {editing && (
        <TemplateEditorModal
          templateId={editing}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
