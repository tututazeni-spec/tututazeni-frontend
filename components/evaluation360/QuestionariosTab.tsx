// components/evaluation360/QuestionariosTab.tsx
// Separador "Questionários" (docs/evaluation360.md §6) — lista dos
// questionários 360° existentes, com publicar/arquivar. A criação e a escolha
// de questionário no "Novo ciclo" foram removidas.

'use client';

import { FilterPanelCard } from './FilterPanelCard';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { QuestionnaireListItem, QuestionnaireStatus } from './types';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useHasRole } from '@/hooks/useCurrentRole';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';

const ALL = 'ALL';

const STATUS_LABEL: Record<QuestionnaireStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const STATUS_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

export function QuestionariosTab() {
  const notify = useToast();
  const canManage = useHasRole(EVAL_CREATOR_ROLES);

  const [status, setStatus] = useState(ALL);

  const params: Record<string, string> = { tenantId: 'default', limit: '50' };
  if (status !== ALL) params.status = status;

  const { data, isLoading } = useApiQuery<{
    data: QuestionnaireListItem[];
    total: number;
  }>(
    queryKeys.evaluation360.questionnaires(params),
    '/evaluation360/questionnaires',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const rows = data?.data ?? [];

  const publish = useApiMutation(
    (id: string) =>
      apiClient.post(`/evaluation360/questionnaires/${id}/publish`),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () =>
        notify({ title: 'Questionário publicado', intent: 'success' }),
      onError: () =>
        notify({
          title: 'Não foi possível publicar',
          description:
            'Confirma que o questionário tem pelo menos uma pergunta.',
          intent: 'danger',
        }),
    },
  );

  const archive = useApiMutation(
    (id: string) =>
      apiClient.post(`/evaluation360/questionnaires/${id}/archive`),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () =>
        notify({ title: 'Questionário arquivado', intent: 'success' }),
    },
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">Questionários</h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            Banco de questionários utilizados nas avaliações 360°.
          </p>
        </div>
      </div>

      <FilterPanelCard>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Estado
          </div>
          <Select
            items={STATUS_OPTIONS}
            value={status}
            onValueChange={setStatus}
          />
        </div>
      </FilterPanelCard>

      {isLoading && <Skeleton rows={3} />}
      {!isLoading && rows.length === 0 && (
        <div className="overflow-hidden rounded-card border border-brand bg-surface p-5 font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand/60 px-5 py-3 font-semibold text-white">
            Questionários
          </h3>
          Nenhum questionário encontrado com estes filtros.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-brand/60 text-left text-xs font-semibold uppercase tracking-wider text-white">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3 text-right">Versão</th>
                <th className="px-4 py-3 text-right">Perguntas</th>
                <th className="px-4 py-3 text-right">Competências</th>
                <th className="px-4 py-3">Escala</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText
                        size={16}
                        strokeWidth={1.75}
                        className="text-ink-muted shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-ink">{q.name}</div>
                        {q.description && (
                          <div className="text-xs text-ink-muted line-clamp-1">
                            {q.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{q.code}</td>
                  <td className="px-4 py-3 text-right text-ink">
                    v{q.version}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {q.questionCount}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {q.competencyCount}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {q.scaleMin}–{q.scaleMax}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-sunken text-ink">
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {q.updatedAt.slice(0, 10)}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {q.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => publish.mutate(q.id)}
                          className="font-body text-xs font-semibold text-brand hover:underline"
                        >
                          Publicar
                        </button>
                      )}
                      {q.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => archive.mutate(q.id)}
                          className="font-body text-xs font-semibold text-ink-muted hover:text-ink"
                        >
                          Arquivar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
