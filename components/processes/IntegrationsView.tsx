// components/processes/IntegrationsView.tsx
// Matriz de integração do módulo Processes com os restantes módulos da INNOVA
// (docs/Modulo_Processes.md §15 e §16). O estado de cada módulo vem da
// actividade real (processos iniciados, modelos que o referenciam, eventos
// recebidos) — não de uma declaração. Mostra também os eventos recebidos, as
// falhas e permite repetir de forma controlada os que falharam.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { AlertTriangle, Boxes, Inbox, Plug, PlugZap } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import { ATTEMPT_STATUS_MAP } from './audit-utils';
import { Skeleton } from './Skeleton';
import type {
  IntegrationModuleStatus,
  PaginatedIntegrationLogs,
  IntegrationOverview,
} from './types';
import { LinkButton } from '@/components/ui/LinkButton';

export interface IntegrationsViewProps {
  canRetry: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const MODULE_STATUS_MAP: StatusBadgeMap<IntegrationModuleStatus> = {
  ACTIVE: { label: 'Activa', cls: 'bg-brand text-white ring-1 ring-white/30' },
  CONFIGURED: {
    label: 'Modelos configurados',
    cls: 'bg-brand text-white ring-1 ring-white/30',
  },
  NO_ACTIVITY: {
    label: 'Sem actividade',
    cls: 'bg-brand text-white ring-1 ring-white/30',
  },
  ERRORS: {
    label: 'Com falhas',
    cls: 'bg-brand text-white ring-1 ring-white/30',
  },
};

// Títulos em português (o backend devolve o nome técnico do módulo).
const MODULE_LABELS: Record<string, string> = {
  Auth: 'Autenticação',
  Users: 'Utilizadores',
  Departments: 'Departamentos',
  Organization: 'Organização',
  Roles: 'Perfis e permissões',
  Courses: 'Cursos',
  CourseModules: 'Módulos de curso',
  LearningPaths: 'Percursos de aprendizagem',
  Enrollments: 'Matrículas',
  Evaluation: 'Avaliação',
  Competencies: 'Competências',
  Performance: 'Desempenho',
  Evaluation360: 'Avaliação 360°',
  CompetencyMap: 'Mapa de competências',
  DevelopmentPlans: 'Planos de desenvolvimento',
  CareerPlans: 'Planos de carreira',
  TalentDevelopment: 'Desenvolvimento de talento',
  Leadership: 'Liderança',
  Succession: 'Sucessão',
  Onboarding: 'Integração de colaboradores',
  Trainings: 'Formações',
  Attendance: 'Assiduidade',
  AITutor: 'Tutor de IA',
  AvatarTraining: 'Formação com avatar',
  MicroLearning: 'Microaprendizagem',
  Knowledge: 'Base de conhecimento',
  ContentLibrary: 'Biblioteca de conteúdos',
  Instructor: 'Formadores',
  Feedback360: 'Feedback 360°',
  Leave: 'Licenças e ausências',
  Payroll: 'Processamento salarial',
  WorkDeclaration: 'Declarações de trabalho',
  Documents: 'Documentos',
  Library: 'Biblioteca',
  Notifications: 'Notificações',
  History: 'Histórico',
  Automation: 'Automação',
  Events: 'Eventos',
  Engagement: 'Envolvimento',
  ExecutiveReports: 'Relatórios executivos',
  Analytics: 'Análises',
  Monitoring: 'Monitorização',
  ApiIntegration: 'Integração por API',
  CrmBeneficiaries: 'CRM — Beneficiários',
  CrmPartners: 'CRM — Parceiros',
  CrmFunders: 'CRM — Financiadores',
  Processes: 'Processos',
};
const moduleLabel = (key: string, fallback: string) =>
  MODULE_LABELS[key] ?? fallback;

// Cor própria de cada card, só na linha colada ao cabeçalho.
const cardHue = (i: number) => Math.round((i * 360) / 47 + 8) % 360;

export function IntegrationsView({
  canRetry,
  onOpenInstance,
}: IntegrationsViewProps) {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [logModule, setLogModule] = useState<string | undefined>();
  const [logStatus, setLogStatus] = useState(ALL);
  const [logPage, setLogPage] = useState(1);

  const overview = useApiQuery<IntegrationOverview>(
    queryKeys.processes.integrations(),
    '/processes/integrations',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const logParams = {
    page: String(logPage),
    limit: '10',
    ...(logModule ? { module: logModule } : {}),
    ...(logStatus !== ALL ? { status: logStatus } : {}),
  };
  const logs = useApiQuery<PaginatedIntegrationLogs>(
    queryKeys.processes.integrationLogs(logParams),
    '/processes/integrations/logs',
    {
      params: logParams,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const retry = useApiMutation(
    (id: number) =>
      apiClient.post(`/processes/integrations/logs/${id}/retry`, {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () =>
        notify({ title: 'Evento repetido com sucesso', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const o = overview.data;
  const q = search.trim().toLowerCase();
  const modules = (o?.modules ?? []).filter(
    (m) =>
      (status === ALL || m.status === status) &&
      (!q ||
        moduleLabel(m.key, m.label).toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-6">
      {overview.isLoading && <Skeleton rows={4} />}
      {overview.error && (
        <div className="font-body text-sm text-danger">
          {overview.error.message}
        </div>
      )}

      {o && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              icon={Boxes}
              label="Módulos na matriz"
              value={o.summary.total}
              sub="integração prevista"
              intent="primary"
            />
            <KpiCard
              icon={PlugZap}
              label="Activas"
              value={o.summary.active}
              sub="já iniciaram processos"
              intent="success"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Com falhas"
              value={o.summary.withErrors}
              sub="eventos por tratar"
              intent="danger"
            />
            <KpiCard
              icon={Inbox}
              iconIntent="caution"
              label="Recepção de eventos"
              value={o.inboundEnabled ? 'Activa' : 'Desactivada'}
              sub={
                o.restrictedToModules
                  ? 'restrita a módulos autorizados'
                  : 'todos os módulos'
              }
              intent={o.inboundEnabled ? 'info' : 'warning'}
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Input
              placeholder="Procurar módulo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[160px] flex-1"
            />
            <Select
              items={[
                { value: ALL, label: 'Todos os estados' },
                { value: 'ACTIVE', label: 'Activas' },
                { value: 'CONFIGURED', label: 'Modelos configurados' },
                { value: 'ERRORS', label: 'Com falhas' },
                { value: 'NO_ACTIVITY', label: 'Sem actividade' },
              ]}
              value={status}
              onValueChange={setStatus}
              className="w-56"
            />
          </div>

          {modules.length === 0 ? (
            <EmptyState
              icon={Plug}
              title="Nenhum módulo"
              description="Nenhum módulo corresponde aos filtros."
              className="mx-auto max-w-xl"
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((m, i) => {
                const hue = cardHue(i);
                return (
                  <div
                    key={m.key}
                    className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
                  >
                    <div
                      className="flex h-16 items-center justify-between gap-2 border-b-4 bg-brand/60 px-4"
                      style={{ borderBottomColor: `hsl(${hue} 65% 50%)` }}
                    >
                      <div className="line-clamp-2 font-body text-sm font-semibold leading-tight text-white">
                        {moduleLabel(m.key, m.label)}
                      </div>
                      <StatusBadge value={m.status} map={MODULE_STATUS_MAP} />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4 text-brand">
                      <div className="flex-1 space-y-1.5">
                        <p className="font-body text-xs leading-relaxed">
                          {m.description}
                        </p>
                        {m.note && (
                          <p className="font-body text-xs text-warning-ink">
                            {m.note}
                          </p>
                        )}
                      </div>

                      <dl className="grid grid-cols-4 divide-x divide-brand/15 rounded-control border border-brand/15 bg-brand/5 py-2 text-center font-body">
                        {[
                          ['Processos', m.instances],
                          ['Em curso', m.openInstances],
                          ['Modelos', m.templates],
                          ['Eventos', m.events],
                        ].map(([k, v]) => (
                          <div key={k} className="px-1">
                            <dd className="text-base font-semibold leading-none">
                              {v}
                            </dd>
                            <dt className="mt-1 text-micro opacity-70">{k}</dt>
                          </div>
                        ))}
                      </dl>

                      <div className="flex items-center justify-between gap-2 border-t border-brand/15 pt-2 font-body text-xs">
                        <span className="opacity-80">
                          {m.lastActivityAt
                            ? `Última actividade ${formatDateTime(m.lastActivityAt)}`
                            : 'Sem actividade'}
                        </span>
                        {m.failedEvents > 0 && (
                          <button
                            type="button"
                            className="shrink-0 font-medium text-danger-ink hover:underline"
                            onClick={() => {
                              setLogModule(m.key);
                              setLogStatus('FAILED');
                              setLogPage(1);
                            }}
                          >
                            {m.failedEvents} falha(s)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {o.unmappedModules.length > 0 && (
            <p className="font-body text-xs text-ink-muted">
              Origens ainda fora da matriz: {o.unmappedModules.join(', ')}.
            </p>
          )}
        </>
      )}

      {/* Eventos recebidos */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Eventos recebidos
          </div>
          <Select
            items={[
              { value: ALL, label: 'Qualquer resultado' },
              { value: 'SUCCESS', label: 'Sucesso' },
              { value: 'FAILED', label: 'Falhas' },
              { value: 'DUPLICATE', label: 'Duplicados ignorados' },
              { value: 'REJECTED', label: 'Rejeitados' },
            ]}
            value={logStatus}
            onValueChange={(v) => {
              setLogStatus(v);
              setLogPage(1);
            }}
            className="w-52"
          />
          {logModule && (
            <LinkButton
              type="button"
              onClick={() => {
                setLogModule(undefined);
                setLogPage(1);
              }}
              className="font-body text-xs"
            >
              Módulo: {moduleLabel(logModule, logModule)} ✕
            </LinkButton>
          )}
        </div>
        {logs.data && logs.data.data.length === 0 && (
          <p className="rounded-card border border-border p-4 font-body text-sm text-ink-faint">
            Nenhum evento de integração recebido ainda.
          </p>
        )}
        {logs.data && logs.data.data.length > 0 && (
          <div className="divide-y divide-border rounded-card border border-border">
            {logs.data.data.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0 font-body text-sm text-ink">
                  <div className="font-medium">
                    {moduleLabel(l.module, l.module)} · {l.event}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatDateTime(l.createdAt)} · {l.processCode ?? '—'} ·{' '}
                    {l.attempts} tentativa(s)
                    {l.correlationId ? ` · correlação ${l.correlationId}` : ''}
                  </div>
                  {l.errorMessage && (
                    <div className="truncate text-xs text-danger-ink">
                      {l.errorMessage}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={l.status} map={ATTEMPT_STATUS_MAP} />
                  {l.instanceId && (
                    <Button
                      intent="ghost"
                      size="sm"
                      onClick={() => onOpenInstance(l.instanceId!)}
                    >
                      Abrir processo
                    </Button>
                  )}
                  {canRetry && l.status === 'FAILED' && (
                    <Button
                      intent="secondary"
                      size="sm"
                      onClick={() => retry.mutate(l.id)}
                      loading={retry.isPending}
                    >
                      Repetir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {logs.data && (
          <Pagination
            page={logs.data.page}
            totalPages={logs.data.totalPages}
            onPageChange={setLogPage}
          />
        )}
      </div>
    </div>
  );
}
