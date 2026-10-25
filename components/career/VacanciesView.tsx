// components/career/VacanciesView.tsx
// Separador "Vagas Internas" — filtro por tipo + candidatura. Dados
// próprios + apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EXECUTIVE_ROLES, isRoleAllowed, type Role } from '@/lib/roles';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  APPLICATION_STATUS_INTENT,
  APPLICATION_STATUS_LABEL,
  VACANCY_TYPE,
  type ApplicationStatus,
} from './constants';
import { NewOpportunityModal } from './NewOpportunityModal';
import { VacancyApplicationsModal } from './VacancyApplicationsModal';
import type { InternalVacancy } from './types';

// Só visível a quem gere vagas — colaboradores só veem vagas OPEN, que é o
// que o backend já devolve por omissão quando `status` não é enviado.
const MANAGE_STATUS_FILTERS = [
  { value: '', label: 'Abertas' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'CLOSED', label: 'Fechadas' },
  { value: 'FILLED', label: 'Preenchidas' },
];

export function VacanciesView() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data: me } = useCurrentUser();
  const canManage = isRoleAllowed(
    EXECUTIVE_ROLES,
    me?.role?.name as Role | undefined,
  );
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [applying, setApplying] = useState<number | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [applicationsFor, setApplicationsFor] =
    useState<InternalVacancy | null>(null);

  const {
    data: resp,
    isLoading: loading,
    refetch,
  } = useApiQuery<{ data: InternalVacancy[] }>(
    queryKeys.career.vacancies(
      typeFilter,
      canManage ? statusFilter : undefined,
    ),
    '/career/vacancies',
    {
      params: {
        type: typeFilter,
        ...(canManage && statusFilter ? { status: statusFilter } : {}),
      },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
  const vacancies = resp?.data ?? [];

  const deleteVacancy = useApiMutation(
    (id: number) => apiClient.delete(`/career/vacancies/${id}`),
    {
      onSuccess: () => {
        refetch();
        notify({ title: 'Oportunidade apagada', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleDelete = async (v: InternalVacancy) => {
    const n = v._count.applications;
    const ok = await confirm({
      title: 'Apagar oportunidade',
      message: `Tem a certeza que quer apagar "${v.title}"?${
        n > 0
          ? ` As ${n} candidatura${n !== 1 ? 's' : ''} associada${n !== 1 ? 's' : ''} também serão apagadas.`
          : ''
      }`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) deleteVacancy.mutate(v.id);
  };

  const publish = async (vacancyId: number) => {
    setPublishing(vacancyId);
    try {
      await apiClient.patch(`/career/vacancies/${vacancyId}/publish`, {});
      await refetch();
      notify({
        title: 'Vaga publicada — colaboradores compatíveis foram notificados',
        intent: 'success',
      });
    } catch (e) {
      reportError(e, { source: 'VacanciesView.publish' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    } finally {
      setPublishing(null);
    }
  };

  const apply = async (vacancyId: number) => {
    setApplying(vacancyId);
    try {
      await apiClient.post(`/career/vacancies/${vacancyId}/apply`, {});
      await refetch();
      notify({
        title: 'Candidatura enviada com sucesso!',
        intent: 'success',
      });
    } catch (e) {
      reportError(e, { source: 'VacanciesView.apply' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    } finally {
      setApplying(null);
    }
  };

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          intent={!typeFilter ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('')}
        >
          Todas
        </Button>
        {Object.entries(VACANCY_TYPE).map(([k, v]) => (
          <Button
            key={k}
            size="sm"
            intent={typeFilter === k ? 'primary' : 'ghost'}
            onClick={() => setTypeFilter(k)}
          >
            {v.label}
          </Button>
        ))}
        {canManage && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setShowNew(true)}
          >
            <Plus size={14} strokeWidth={1.75} /> Nova Oportunidade
          </Button>
        )}
      </div>

      {canManage && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="font-body text-xs text-ink-faint">Estado:</span>
          {MANAGE_STATUS_FILTERS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              intent={statusFilter === s.value ? 'secondary' : 'ghost'}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {vacancies.map((v) => {
            const typeCfg = VACANCY_TYPE[v.type] ?? {
              label: v.type,
              intent: 'neutral' as const,
            };
            return (
              <div
                key={v.id}
                className="overflow-hidden rounded-[18px] border border-brand-line bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-brand-mid to-brand-dark px-5 py-3.5 text-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <Briefcase size={18} strokeWidth={1.75} />
                      <h3 className="truncate font-body text-sm font-semibold uppercase tracking-wider">
                        {v.title}
                      </h3>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-xs text-white/85">
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                        {typeCfg.label}
                      </span>
                      {v.status !== 'OPEN' && (
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                          {v.status === 'DRAFT'
                            ? 'Rascunho'
                            : v.status === 'CLOSED'
                              ? 'Fechada'
                              : 'Preenchida'}
                        </span>
                      )}
                      {v.matchScore !== undefined && (
                        <span className="rounded-full bg-[#075FE8] px-2.5 py-0.5 font-semibold">
                          {v.matchScore}% match
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Apagar ${v.title}`}
                      disabled={deleteVacancy.isPending}
                      onClick={() => handleDelete(v)}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={14} strokeWidth={1.75} /> Apagar
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3 font-body text-xs text-brand/60">
                    {v.position?.name && <span>{v.position.name} · </span>}
                    {v.department?.name && <span>{v.department.name}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-brand/60">
                      {v._count.applications} candidatura
                      {v._count.applications !== 1 ? 's' : ''}
                      {v.closingDate &&
                        ` · Fecha ${new Date(v.closingDate).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <Button
                          size="sm"
                          intent="ghost"
                          onClick={() => setApplicationsFor(v)}
                        >
                          Ver candidaturas
                        </Button>
                      )}
                      {canManage && v.status === 'DRAFT' ? (
                        <Button
                          size="sm"
                          onClick={() => publish(v.id)}
                          loading={publishing === v.id}
                        >
                          Publicar
                        </Button>
                      ) : v.status === 'OPEN' ? (
                        v.applied ? (
                          <Badge
                            intent={
                              APPLICATION_STATUS_INTENT[
                                v.applicationStatus as ApplicationStatus
                              ] ?? 'neutral'
                            }
                          >
                            {APPLICATION_STATUS_LABEL[
                              v.applicationStatus as ApplicationStatus
                            ] ??
                              v.applicationStatus ??
                              'Candidatado'}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => apply(v.id)}
                            loading={applying === v.id}
                          >
                            Candidatar-me
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                  {v.matchScore !== undefined && v.matchScore > 0 && (
                    <ProgressBar value={v.matchScore} className="mt-2" />
                  )}
                </div>
              </div>
            );
          })}
          {vacancies.length === 0 && (
            <div className="col-span-2">
              <EmptyState
                title="Sem vagas internas"
                description="Ainda não há vagas internas disponíveis para o filtro seleccionado."
              />
            </div>
          )}
        </div>
      )}

      {showNew && (
        <NewOpportunityModal
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            // Nasce como rascunho — o filtro "Abertas" esconderia a vaga acabada de criar.
            setStatusFilter('DRAFT');
            refetch();
            notify({
              title:
                'Oportunidade guardada como rascunho — publique-a para a abrir aos colaboradores',
              intent: 'success',
            });
          }}
        />
      )}
      {applicationsFor && (
        <VacancyApplicationsModal
          vacancyId={applicationsFor.id}
          vacancyTitle={applicationsFor.title}
          onClose={() => setApplicationsFor(null)}
        />
      )}
    </div>
  );
}
