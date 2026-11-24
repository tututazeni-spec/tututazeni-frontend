// components/career/VacanciesView.tsx
// Separador "Vagas Internas" — filtro por tipo + candidatura. Dados
// próprios + apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  Eye,
  Filter,
  Plus,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
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
import { Select } from '@/components/ui/Select';
import { usePositionOptions } from '@/components/competencies/modelFormData';
import { EmptyState } from '@/components/ui/EmptyState';
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
  const [positionFilter, setPositionFilter] = useState('');
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
  const allVacancies = resp?.data ?? [];
  const vacancies = positionFilter
    ? allVacancies.filter((v) => v.position?.name === positionFilter)
    : allVacancies;
  const typeItems = [
    { value: 'ALL', label: 'Todos os tipos' },
    ...Object.entries(VACANCY_TYPE).map(([k, t]) => ({
      value: k,
      label: t.label,
    })),
  ];
  const { options: positionOptions } = usePositionOptions();
  const positionNames = Array.from(
    new Set(positionOptions.map((o) => o.label)),
  ).sort((x, y) => x.localeCompare(y, 'pt'));
  if (positionFilter && !positionNames.includes(positionFilter))
    positionNames.push(positionFilter);
  const positionItems = [
    { value: 'ALL', label: 'Todos os cargos' },
    ...positionNames.map((n) => ({ value: n, label: n })),
  ];

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
      {/* Filtros underline: tipo de oportunidade e cargo */}
      <div className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div className="w-full sm:w-64">
          <Select
            variant="underline"
            icon={Filter}
            items={typeItems}
            value={typeFilter || 'ALL'}
            onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            variant="underline"
            icon={Users}
            items={positionItems}
            value={positionFilter || 'ALL'}
            onValueChange={(v) => setPositionFilter(v === 'ALL' ? '' : v)}
          />
        </div>
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
        <div className="space-y-3">
          {vacancies.map((v) => {
            const typeCfg = VACANCY_TYPE[v.type] ?? {
              label: v.type,
              intent: 'neutral' as const,
            };
            const n = v._count.applications;
            return (
              <div
                key={v.id}
                className="relative flex min-h-[104px] items-center gap-5 overflow-hidden rounded-[18px] border-l-[5px] border-l-[#3FAE5A] bg-gradient-to-r from-[#0A1B3F] via-[#0B2352] to-[#0D2A66] py-3 pl-5 pr-4 text-white shadow-[0_8px_30px_rgba(11,61,145,0.18)]"
              >
                {/* Formas diagonais subtis à direita */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-white/[0.04]"
                  style={{
                    clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0 100%)',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-[22%] bg-white/[0.04]"
                  style={{
                    clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 0 100%)',
                  }}
                />

                <span
                  aria-hidden="true"
                  className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4CC26B] to-[#2E9A4A]"
                >
                  <Briefcase
                    size={28}
                    strokeWidth={1.75}
                    className="text-white"
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-[80px] w-px shrink-0 bg-white/40"
                />

                <div className="relative min-w-0 flex-1">
                  <h3 className="truncate font-body text-lg font-bold uppercase leading-tight">
                    {v.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-xs font-semibold">
                    <span className="rounded-full bg-[#1B2E66] px-3.5 py-1 text-white">
                      {typeCfg.label}
                    </span>
                    {v.status !== 'OPEN' && (
                      <span className="rounded-full bg-[#1B2E66] px-3.5 py-1 text-white">
                        {v.status === 'DRAFT'
                          ? 'Rascunho'
                          : v.status === 'CLOSED'
                            ? 'Fechada'
                            : 'Preenchida'}
                      </span>
                    )}
                    {v.matchScore !== undefined && (
                      <span className="rounded-full bg-[#3FAE5A] px-3.5 py-1 text-white">
                        {v.matchScore}% compatível
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 font-body text-sm text-white/90">
                    <span className="inline-flex items-center gap-2">
                      <Users size={16} strokeWidth={1.75} />
                      {v.position?.name}
                      {v.position?.name && v.department?.name && ' · '}
                      {v.department?.name}
                    </span>
                    <span aria-hidden="true" className="h-5 w-px bg-white/30" />
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} strokeWidth={1.75} />
                      {n} candidatura{n !== 1 ? 's' : ''}
                      {v.closingDate &&
                        ` · Fecha ${new Date(v.closingDate).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' })}`}
                    </span>
                    {canManage && (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-5 w-px bg-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => setApplicationsFor(v)}
                          className="inline-flex items-center gap-2 rounded-control transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        >
                          <Eye size={16} strokeWidth={1.75} />
                          Ver candidaturas
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative flex shrink-0 flex-col items-stretch gap-2">
                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Apagar ${v.title}`}
                      disabled={deleteVacancy.isPending}
                      onClick={() => handleDelete(v)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/60 px-6 font-body text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={16} strokeWidth={1.75} /> Apagar
                    </button>
                  )}
                  {canManage && v.status === 'DRAFT' ? (
                    <button
                      type="button"
                      disabled={publishing === v.id}
                      onClick={() => publish(v.id)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#3FAE5A] px-6 font-body text-sm font-bold text-white transition-colors hover:bg-[#379B50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={16} strokeWidth={1.75} />
                      {publishing === v.id ? 'A publicar…' : 'Publicar'}
                    </button>
                  ) : v.status === 'OPEN' ? (
                    v.applied && v.applicationStatus === 'PENDING' ? (
                      <span className="inline-flex h-9 items-center justify-center rounded-full bg-[#F97316] px-6 font-body text-sm font-bold text-white">
                        {APPLICATION_STATUS_LABEL.PENDING}
                      </span>
                    ) : v.applied ? (
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
                      <button
                        type="button"
                        disabled={applying === v.id}
                        onClick={() => apply(v.id)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#3FAE5A] px-6 font-body text-sm font-bold text-white transition-colors hover:bg-[#379B50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send size={16} strokeWidth={1.75} />
                        {applying === v.id ? 'A enviar…' : 'Candidatar-me'}
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
          {vacancies.length === 0 && (
            <EmptyState
              title="Sem vagas internas"
              description="Ainda não há vagas internas disponíveis para o filtro seleccionado."
            />
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
