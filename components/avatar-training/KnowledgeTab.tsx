// components/avatar-training/KnowledgeTab.tsx
// Base de Conhecimento (docs/Avatar_Training.md §2/§8): fontes aprovadas que o
// avatar e o AI-Tutor podem consultar numa sessão. Sem fonte, o tutor
// encaminha para um formador — nunca inventa.

'use client';

import { useState } from 'react';
import { BookOpen, Filter, GraduationCap, List, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { useSourceOptions } from '@/hooks/useSourceOptions';
import { SessionCardPicker } from './cards';
import { useSessionDetail } from './SessionPicker';
import { SOURCE_LABEL } from './constants';
import type { SourceType } from './types';

export function KnowledgeTab() {
  const notify = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>('LESSON');
  const [sourceId, setSourceId] = useState('');
  const [lessonCourse, setLessonCourse] = useState('');
  const [manual, setManual] = useState(false);
  const options = useSourceOptions(sourceType, lessonCourse);
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
      <SessionCardPicker value={sessionId} onChange={setSessionId} />

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
                <EmptyState
                  variant="inline"
                  title="Sem fontes aprovadas — o tutor encaminhará as dúvidas para um formador"
                />
              ) : (
                data.knowledgeSources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold text-ink">
                        {s.title ??
                          `${SOURCE_LABEL[s.sourceType]} ${s.sourceId}`}
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

            <Card>
              <CardBody className="space-y-5">
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
                  <Select
                    variant="underline"
                    icon={Filter}
                    value={sourceType}
                    onValueChange={(v) => {
                      setSourceType(v as SourceType);
                      setSourceId('');
                      setLessonCourse('');
                    }}
                    items={(Object.keys(SOURCE_LABEL) as SourceType[]).map(
                      (t) => ({
                        value: t,
                        label: SOURCE_LABEL[t],
                      }),
                    )}
                  />
                  {sourceType === 'LESSON' && !manual && (
                    <Combobox
                      variant="underline"
                      icon={GraduationCap}
                      items={options.courseOptions}
                      value={lessonCourse || undefined}
                      onValueChange={(v) => {
                        setLessonCourse(v);
                        setSourceId('');
                      }}
                      placeholder="Curso da lição"
                      searchPlaceholder="Escreva para filtrar cursos…"
                      emptyText="Nenhum curso encontrado"
                    />
                  )}
                  {manual ? (
                    <FormField label="ID da fonte" htmlFor="ks-id">
                      <Input
                        id="ks-id"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                      />
                    </FormField>
                  ) : (
                    <Combobox
                      variant="underline"
                      icon={List}
                      items={options.items}
                      value={sourceId || undefined}
                      onValueChange={setSourceId}
                      disabled={sourceType === 'LESSON' && !lessonCourse}
                      placeholder={
                        options.loading
                          ? 'A carregar…'
                          : sourceType === 'LESSON' && !lessonCourse
                            ? 'Escolha primeiro o curso'
                            : `Escolher ${SOURCE_LABEL[sourceType].toLowerCase()}`
                      }
                      searchPlaceholder="Escreva para filtrar…"
                      emptyText="Nada encontrado"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    loading={add.isPending}
                    disabled={!sourceId.trim()}
                    onClick={() => add.mutate(undefined)}
                  >
                    Associar fonte
                  </Button>
                  <Button
                    size="sm"
                    intent="ghost"
                    onClick={() => {
                      setManual((m) => !m);
                      setSourceId('');
                    }}
                  >
                    {manual ? 'Escolher da lista' : 'Introduzir ID'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </>
        )
      )}
    </div>
  );
}
