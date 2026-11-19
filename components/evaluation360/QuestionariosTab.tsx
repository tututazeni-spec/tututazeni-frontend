// components/evaluation360/QuestionariosTab.tsx
// separador "Questionários" (docs/evaluation360.md §6) — banco de questionários
// 360°: criar, ver/editar perguntas (em rascunho), publicar, arquivar e
// eliminar. Os publicados podem ser escolhidos no "Novo ciclo".

'use client';

import { FilterPanelCard } from './FilterPanelCard';
import { useState } from 'react';
import { FileText, MapPin, Plus } from 'lucide-react';
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
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/providers/ConfirmProvider';
import { QuestionnaireFormModal } from './QuestionnaireFormModal';
import { QuestionnaireDetailModal } from './QuestionnaireDetailModal';
import { CompetencyExportMenu } from '@/components/competencies/CompetencyExportMenu';

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
  const confirm = useConfirm();
  const canManage = useHasRole(EVAL_CREATOR_ROLES);

  const [status, setStatus] = useState(ALL);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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

  const remove = useApiMutation(
    (id: string) => apiClient.delete(`/evaluation360/questionnaires/${id}`),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () =>
        notify({ title: 'Questionário eliminado', intent: 'success' }),
      onError: () =>
        notify({
          title: 'Não foi possível eliminar',
          description:
            'Só rascunhos ou arquivados que nunca foram usados por um ciclo.',
          intent: 'danger',
        }),
    },
  );

  const handleRemove = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Eliminar questionário?',
      message: `"${name}" e as suas perguntas serão eliminados.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(id);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">Questionários</h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            Banco de questionários utilizados nas avaliações 360°.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} strokeWidth={1.75} />
              Novo questionário
            </Button>
          )}
          <CompetencyExportMenu
            disabled={isLoading}
            build={() => ({
              title: 'Avaliação 360° — Questionários',
              filename: 'questionarios-360',
              headers: [
                'Nome',
                'Código',
                'Versão',
                'Perguntas',
                'Competências',
                'Escala',
                'Estado',
                'Actualizado',
              ],
              rows: rows.map((q) => [
                q.name,
                q.code,
                `v${q.version}`,
                q.questionCount,
                q.competencyCount,
                `${q.scaleMin}–${q.scaleMax}`,
                STATUS_LABEL[q.status],
                q.updatedAt.slice(0, 10),
              ]),
            })}
          />
        </div>
      </div>

      <FilterPanelCard>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Estado
          </div>
          <Select
            variant="underline"
            icon={MapPin}
            items={STATUS_OPTIONS}
            value={status}
            onValueChange={setStatus}
          />
        </div>
      </FilterPanelCard>

      {isLoading && <Skeleton rows={3} />}
      {!isLoading && rows.length === 0 && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Questionários
          </h3>
          Nenhum questionário encontrado com estes filtros.
          {canManage && ' Usa "Novo questionário" para criar o primeiro.'}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full font-body text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-brand-dark text-left text-xs font-semibold uppercase tracking-wider text-white">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3 text-right">Versão</th>
                <th className="px-4 py-3 text-right">Perguntas</th>
                <th className="px-4 py-3 text-right">Competências</th>
                <th className="px-4 py-3">Escala</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3" />
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
                        className="text-black shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-black">{q.name}</div>
                        {q.description && (
                          <div className="text-xs text-black line-clamp-1">
                            {q.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-black">
                    v{q.version}
                  </td>
                  <td className="px-4 py-3 text-right text-black">
                    {q.questionCount}
                  </td>
                  <td className="px-4 py-3 text-right text-black">
                    {q.competencyCount}
                  </td>
                  <td className="px-4 py-3 text-black">
                    {q.scaleMin}–{q.scaleMax}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-black">
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black whitespace-nowrap">
                    {q.updatedAt.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(q.id)}
                      className="font-body text-xs font-semibold text-black hover:underline"
                    >
                      {canManage && q.status === 'DRAFT'
                        ? 'Editar perguntas'
                        : 'Ver'}
                    </button>
                    {canManage && q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => publish.mutate(q.id)}
                        className="font-body text-xs font-semibold text-black hover:underline"
                      >
                        Publicar
                      </button>
                    )}
                    {canManage && q.status === 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => archive.mutate(q.id)}
                        className="font-body text-xs font-semibold text-black hover:text-black"
                      >
                        Arquivar
                      </button>
                    )}
                    {canManage && q.status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(q.id, q.name)}
                        className="font-body text-xs font-semibold text-black hover:text-danger-ink"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <QuestionnaireFormModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            setOpenId(id);
          }}
        />
      )}
      {openId && (
        <QuestionnaireDetailModal
          questionnaireId={openId}
          canManage={canManage}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
