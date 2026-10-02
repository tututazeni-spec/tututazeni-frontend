// components/avatar-training/KnowledgeTab.tsx
// Base de Conhecimento (docs/Avatar_Training.md §2/§8): fontes aprovadas que o
// avatar e o AI-Tutor podem consultar numa sessão. Sem fonte, o tutor
// encaminha para um formador — nunca inventa.

'use client';

import { useState } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { SessionPicker, useSessionDetail } from './SessionPicker';
import type { SourceType } from './types';

const SOURCE_LABEL: Record<SourceType, string> = {
  COURSE: 'Curso',
  LESSON: 'Lição',
  DOCUMENT: 'Documento',
  LIBRARY_ITEM: 'Item da biblioteca',
};

export function KnowledgeTab() {
  const notify = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>('LESSON');
  const [sourceId, setSourceId] = useState('');
  const { data, error, refetch } = useSessionDetail(sessionId);
  const key = queryKeys.avatarTraining.session(sessionId ?? 0);

  const onError = (e: Error) =>
    notify({
      title: 'Não foi possível actualizar as fontes',
      description: e.message,
      intent: 'danger',
    });
  const add = useApiMutation(
    () =>
      apiClient.post(`/avatar-training/sessions/${sessionId}/sources`, {
        sourceType,
        sourceId: sourceId.trim(),
      }),
    {
      invalidateKeys: [key],
      onSuccess: () => setSourceId(''),
      onError,
    },
  );
  const remove = useApiMutation(
    (id: number) =>
      apiClient.delete(`/avatar-training/sessions/${sessionId}/sources/${id}`),
    { invalidateKeys: [key], onError },
  );

  return (
    <div className="space-y-4">
      <SessionPicker value={sessionId} onChange={setSessionId} />

      {sessionId === null ? (
        <EmptyState
          icon={BookOpen}
          title="Escolha uma sessão"
          description="Cada sessão tem as suas fontes aprovadas (lição, documento ou item da biblioteca)."
        />
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : (
        data && (
          <>
            <div className="space-y-2">
              {data.knowledgeSources.length === 0 ? (
                <p className="rounded-card border border-dashed border-border-strong bg-surface p-4 text-center font-body text-sm text-ink-faint">
                  Sem fontes aprovadas — o tutor encaminhará as dúvidas para um
                  formador.
                </p>
              ) : (
                data.knowledgeSources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold text-ink">
                        {s.title ?? `${SOURCE_LABEL[s.sourceType]} ${s.sourceId}`}
                      </div>
                      <div className="font-body text-xs text-ink-muted">
                        {SOURCE_LABEL[s.sourceType]} #{s.sourceId} · {s.status}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      intent="ghost"
                      aria-label="Remover fonte"
                      loading={remove.isPending && remove.variables === s.id}
                      onClick={() => remove.mutate(s.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
              <FormField label="Tipo" htmlFor="ks-type">
                <Select
                  value={sourceType}
                  onValueChange={(v) => setSourceType(v as SourceType)}
                  items={(Object.keys(SOURCE_LABEL) as SourceType[]).map((t) => ({
                    value: t,
                    label: SOURCE_LABEL[t],
                  }))}
                />
              </FormField>
              <FormField label="ID da fonte" htmlFor="ks-id">
                <Input
                  id="ks-id"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                />
              </FormField>
              <Button
                size="sm"
                loading={add.isPending}
                disabled={!sourceId.trim()}
                onClick={() => add.mutate(undefined)}
              >
                Associar fonte
              </Button>
            </div>
          </>
        )
      )}
    </div>
  );
}
