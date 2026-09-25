// components/evaluation360/QuestionariosTab.tsx
// Separador "Questionários" (docs/evaluation360.md §6) — banco reutilizável
// de questionários, distinto das perguntas soltas de um ciclo (Eval360Question,
// aba não exposta directamente). Publicar aqui torna o questionário elegível
// para ser escolhido em CreateCycleModal ("Questionário"), que clona as suas
// competências+perguntas para o novo ciclo (evaluation360.service.ts#createCycle).

'use client';

import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { QuestionnaireListItem, QuestionnaireStatus } from './types';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { CreateQuestionnaireModal } from './CreateQuestionnaireModal';

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
  const role = useCurrentRole();
  const canManage = !!role && EVAL_CREATOR_ROLES.includes(role);

  const [status, setStatus] = useState(ALL);
  const [showCreate, setShowCreate] = useState(false);

  const params: Record<string, string> = { tenantId: 'default', limit: '50' };
  if (status !== ALL) params.status = status;

  const { data, isLoading, refetch } = useApiQuery<{
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
            Banco reutilizável de questionários 360° — escolhe um ao criar um
            novo ciclo.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowCreate(true)}
            className="shrink-0 gap-2"
          >
            <Plus size={16} strokeWidth={2} /> Novo Questionário
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
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
      </div>

      {isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}
      {!isLoading && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Nenhum questionário encontrado com estes filtros.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
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

      {showCreate && (
        <CreateQuestionnaireModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
